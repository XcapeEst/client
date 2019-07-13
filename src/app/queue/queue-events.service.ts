import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { QueueSlot } from './models/queue-slot';
import { IoClientService } from '@app/core/io-client.service';
import { QueueState } from './models/queue-state';

@Injectable({
  providedIn: 'root'
})
export class QueueEventsService {

  private _slotUpdate = new Subject<QueueSlot>();
  private _stateUpdate = new Subject<QueueState>();

  get slotUpdate() {
    return this._slotUpdate.asObservable();
  }

  get stateUpdate() {
    return this._stateUpdate.asObservable();
  }

  constructor(
    private ioClientService: IoClientService,
  ) {
    this.ioClientService.socket.on('queue slot update', (slot: QueueSlot) => this._slotUpdate.next(slot));
    this.ioClientService.socket.on('queue state update', (state: QueueState) => this._stateUpdate.next(state));
  }
}
