import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';
import { TokenizeService } from './tokenize.service';

@WebSocketGateway({ namespace: '/ws/tokenize', cors: { origin: '*' } })
export class TokenizeGateway implements OnModuleInit {
  @WebSocketServer() server!: Server;

  constructor(private readonly tokenize: TokenizeService) {}

  onModuleInit() {
    // Dengarkan event job update dari TokenizeService
    this.tokenize.on('jobUpdate', (job) => {
      this.server.to(job.jobId).emit('progress', job);
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: { jobId: string }, @ConnectedSocket() client: Socket) {
    if (data?.jobId) {
      client.join(data.jobId);
      const current = this.tokenize.getJob(data.jobId);
      if (current) {
        client.emit('progress', current);
      }

      // Listen on-demand per job
      this.tokenize.on(`job:${data.jobId}`, (job) => {
        client.emit('progress', job);
      });
    }
  }
}

