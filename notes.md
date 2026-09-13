**Setting up AWS EC2 Server**
- I set up the server and assigned an elastic IP address. For now it's the cheapest server, a t3.nano. Remember to cancel the 
Elastic IP addrss and terminate the server after the class. For now, the cost to leave it running is the same as keeping the IP address.

To get into the server run this:
```ssh -i ~/.ssh/production.pem ubuntu@100.57.209.154```

My elastic IP address:
100.57.209.154

My DNS Domain (now supports HTTPS):
https://cs260hwtrackr.click/index.html

Working directory:
cd Desktop/Fall\ 2026/CS\ 260/startup/

The key is located in ~/.ssh locally for future reference.