import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../config';
import { StockUpdate } from '../models';

/**
 * Wraps the Socket.io connection and surfaces `stock:update` events as an
 * RxJS stream. No polling anywhere — the backend pushes every change.
 */
@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  private stockUpdates$ = new Subject<StockUpdate>();

  constructor() {
    this.socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    this.socket.on('stock:update', (payload: StockUpdate) => {
      this.stockUpdates$.next(payload);
    });
  }

  /** Live remaining-stock updates for all items. */
  onStockUpdate(): Observable<StockUpdate> {
    return this.stockUpdates$.asObservable();
  }
}
