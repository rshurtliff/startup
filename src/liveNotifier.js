// The one WebSocket connection to the Trackr service. App connects it when I
// log in and closes it when I log out. Pages add a handler to hear what the
// server sends, and remove it when they go away.
class LiveConnection {
  socket = null;

  // Functions that get every message the server sends
  handlers = [];

  // Functions that hear when the connection state changes, so the Live pills
  // can show whether it's really connected
  statusHandlers = [];

  // 'off' (logged out), 'connecting', 'connected', or 'reconnecting'
  status = 'off';

  // Whether I want to be connected. A close while this is true was a drop,
  // so try again. A close after disconnect() was on purpose.
  wanted = false;

  // How long to wait before trying again. Doubles after each failed try, up
  // to 30 seconds, so a server that's down doesn't get hammered.
  retryDelay = 1000;
  retryTimer = null;

  connect() {
    this.wanted = true;
    if (!this.socket) {
      this.open();
    }
  }

  disconnect() {
    this.wanted = false;
    clearTimeout(this.retryTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('off');
  }

  open() {
    // ws:// on localhost, wss:// on the real site, the same way http and https
    // pair up. window.location.host includes the port, so in development this
    // goes to Vite, which passes it to the service.
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    this.socket = socket;
    if (this.status !== 'reconnecting') {
      this.setStatus('connecting');
    }

    socket.onopen = () => {
      this.retryDelay = 1000;
      this.setStatus('connected');
    };

    // Every message is JSON with a type, like { type: 'connected' }
    socket.onmessage = (message) => {
      let event;
      try {
        event = JSON.parse(message.data);
      } catch {
        return;
      }
      this.handlers.forEach((handler) => handler(event));
    };

    // Also runs when the server turns the connection down, like a 401 after
    // the login expired. Either way, wait and try again if I still want it.
    socket.onclose = () => {
      if (this.socket !== socket) {
        return;
      }
      this.socket = null;
      if (!this.wanted) {
        return;
      }
      this.setStatus('reconnecting');
      this.retryTimer = setTimeout(() => this.open(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, 30000);
    };
  }

  setStatus(status) {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  addHandler(handler) {
    this.handlers.push(handler);
  }

  removeHandler(handler) {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  addStatusHandler(handler) {
    this.statusHandlers.push(handler);
  }

  removeStatusHandler(handler) {
    this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
  }
}

export const LiveNotifier = new LiveConnection();
