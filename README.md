# Collaborative Drawing Prototype

Want to see more prototypes like this? Support me on Patreon!

<a href="https://patreon.com/endel" title="Donate to this project using Patreon"><img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2Fendel&style=for-the-badge" alt="Patreon donate button"/></a>

---

This is a multiplayer drawing prototype. The lines drawn by each player are synched and then drawed for every player connected in the room.

## Requirements & installation

This demo requires:

- [Node.js v10+](https://nodejs.org/en/download/)
- [MongoDB](https://www.mongodb.com/download-center)

Install its dependencies:

```
npm install
```

Run the project

```
npm start
```


## Features

- Chat
- List of online members
- Drawing sessions have an expiration time (2 minutes, 5 minutes, 1 hour, etc.)
- Drawings are stored in the database once the session expires
- 4 different brush styles to select (adapted from http://perfectionkills.com/exploring-canvas-drawing-techniques/#nearby-connections)
- Color selection

## License

MIT.
