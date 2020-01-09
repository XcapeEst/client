import { Injectable, Inject } from '@angular/core';
import { AuthService } from '@app/auth/auth.service';
import * as socketIo from 'socket.io-client';
import { WS_URL } from '@app/ws-url';
import { Store } from '@ngrx/store';
import { loadQueue } from '@app/queue/queue.actions';
import { of, Observable, ReplaySubject } from 'rxjs';
import { map, switchMap, tap, first } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '@app/api-url';
import { TokenStoreService } from '@app/auth/token-store.service';
import * as jwt_decode from 'jwt-decode';

function callWsMethod<T>(socket: SocketIOClient.Socket, methodName: string, ...args: any[]): Observable<T> {
  return new Observable(observer => {
    const _args = args.length > 0 ? args : [{ }]; // we need to pass at least one argument due to NestJS limitation
    socket.emit(methodName, ..._args, (response: T) => {
      observer.next(response);
      observer.complete();
    });
  });
}

@Injectable({
  providedIn: 'root'
})
export class IoClientService {

  private _socket = new ReplaySubject<SocketIOClient.Socket>(1);

  get socket(): Observable<SocketIOClient.Socket> {
    return this._socket.asObservable();
  }

  constructor(
    private authService: AuthService,
    @Inject(WS_URL) private wsUrl: string,
    private store: Store<{}>,
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string,
    private tokenStore: TokenStoreService,
  ) {
    this.connect();
  }

  public call<T>(methodName: string, ...args: any[]): Observable<T> {
    return this.socket.pipe(
      first(),
      switchMap(socket => callWsMethod<T>(socket, methodName, ...args)),
    );
  }

  private connect() {
    let createSocket: Observable<SocketIOClient.Socket>;

    if (this.authService.authenticated) {
      createSocket = this.validateToken().pipe(
        map(wsToken => ({ query: `auth_token=${wsToken}` })),
        map(options => socketIo(this.wsUrl, options)),
      );
    } else {
      createSocket = of(socketIo(this.wsUrl));
    }

    createSocket.subscribe(socket => {
      socket.on('connect', () => this.store.dispatch(loadQueue()));
      socket.on('error', (error: Error) => {
        switch (error.message) {
          case 'Signature verification failed': {
            this.refreshToken().subscribe(token => {
              socket.io.opts.query = `auth_token=${token}`;
              socket.connect();
            });
            break;
          }

          default:
            console.error(error.message);
        }
      });
      socket.on('reconnect_attempt', () => {
        socket.io.opts.query = `auth_token=${this.tokenStore.wsToken}`;
      });
      socket.on('exception', ({ message }) => {
        console.error(message);
      });
      this._socket.next(socket);
    });
  }

  private validateToken(): Observable<string> {
    if (this.tokenStore.wsToken) {
      try {
        const decoded = jwt_decode(this.tokenStore.wsToken) as { exp: number };
        if (Date.now() >= decoded.exp * 1000) {
          return this.refreshToken();
        } else {
          // refresh ws token when the current one expires
          const timeout = decoded.exp * 1000 - Date.now();
          setTimeout(() => this.refreshToken().subscribe(), timeout);
          return of(this.tokenStore.wsToken);
        }
      } catch (error) {
        console.error(error);
        return this.refreshToken();
      }
    } else {
      return this.refreshToken();
    }
  }

  private refreshToken(): Observable<string> {
    return this.http.get<{ wsToken: string }>(`${this.apiUrl}/auth/wstoken`).pipe(
      map(({ wsToken }) => wsToken),
      tap(wsToken => this.tokenStore.wsToken = wsToken),
      tap(wsToken => {
        try {
          const decoded = jwt_decode(wsToken) as { exp: number };
          const timeout = decoded.exp * 1000 - Date.now();
          setTimeout(() => this.refreshToken().subscribe(), timeout);
        } catch (error) {
          console.error(error);
        }
      }),
    );
  }

}
