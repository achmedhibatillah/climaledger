import { OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RustTestnetService } from './rust-testnet.service';

@WebSocketGateway({ namespace: '/ws/testnet', cors: { origin: '*' } })
export class RustTestnetGateway implements OnModuleInit {
  @WebSocketServer() server!: Server;

  constructor(private readonly testnet: RustTestnetService) {}

  onModuleInit() {
    // Setiap event dari child-process Rust diteruskan apa adanya ke seluruh client yang subscribe.
    this.testnet.on('log', (payload) => this.server.emit('log', payload));
    this.testnet.on('exit', (payload) => this.server.emit('exit', payload));
    this.testnet.on('error', (err) => this.server.emit('error', { message: err.message }));
  }

  @SubscribeMessage('status')
  handleStatusRequest() {
    return this.testnet.getStatus();
  }
}
