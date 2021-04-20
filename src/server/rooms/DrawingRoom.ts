import { Room, Client } from "colyseus";
import { State, Path, DEFAULT_BRUSH } from "./State";
import { Player } from "./Player";
import { generateName } from "../utils/name_generator";

export class DrawingRoom extends Room<State> {
  autoDispose = false;
  lastChatMessages: string[] = [];

  onCreate(options) {
    this.setState(new State());
    this.state.expiration = options.expiration;
    this.state.countdown = options.expiration;

    this.onMessage("chat", (client: Client, message: any) => {
      const player: Player = this.state.players[client.sessionId];
      const chatMsg = `${player.name}: ${message}`;

      this.broadcast('chat', chatMsg);
      this.lastChatMessages.push(chatMsg);

      // prevent history from being 50+ messages long.
      if (this.lastChatMessages.length > 50) {
        this.lastChatMessages.shift();
      }
    });

    this.onMessage("s", (client: Client, message: any) => {
      //
      // start new path.
      //
      // store it in the `player` instance temporarily,
      // and assign it to the state.paths once it's complete!
      //
      const player: Player = this.state.players[client.sessionId];

      const path = new Path();
      path.sessionId = client.sessionId;
      path.points.push(...message[0]);
      path.color = message[1];
      path.brush = message[2] || DEFAULT_BRUSH;

      this.state.paths.push(path);
      player.lastPath = path;

    });

    this.onMessage("p", (client: Client, message: any) => {
      //
      // add point to the path
      //
      const player: Player = this.state.players[client.sessionId];
      player.lastPath.points.push(...message);
    });

    this.onMessage("e", (client: Client, message: any) => {
      //
      // end the path
      // this is now going to synchronize with all clients
      //
      const player: Player = this.state.players[client.sessionId];
      player.lastPath.finished = true;
    });

    this.setSimulationInterval(() => this.countdown(), 1000);
  }

  onJoin(client: Client, options: any) {
    const player = this.state.createPlayer(client.sessionId);
    player.name = options.nickname || generateName();

    this.lastChatMessages.forEach(chatMsg => client.send('chat', chatMsg));
  }

  countdown() {
    if (this.state.countdown > 0) {
      this.state.countdown--;

    } else if (!this.autoDispose) {
      this.autoDispose = true;
      this.resetAutoDisposeTimeout(5);
    }
  }

  onLeave(client: Client) {
    this.state.removePlayer(client.sessionId);
  }

  async onDispose() {
    console.log("Disposing DrawingRoom.");
  }

}
