import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppState } from '@app/app.state';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Player } from '../models/player';
import { map, switchMap, tap } from 'rxjs/operators';
import { playerById } from '../players.selectors';
import { loadPlayer } from '../players.actions';

@Component({
  selector: 'app-player-details',
  templateUrl: './player-details.component.html',
  styleUrls: ['./player-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDetailsComponent implements OnInit {

  player: Observable<Player>;

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
  ) { }

  ngOnInit() {
    this.player = this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => this.store.select(playerById(id)).pipe(
        tap(player => {
          if (!player) {
            this.store.dispatch(loadPlayer({ playerId: id }));
          }
        })
      ))
    );
  }

}
