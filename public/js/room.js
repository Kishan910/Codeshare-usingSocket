const socket = io();
let debounceTimeout;
let editor = document.getElementById("editor");

editor.addEventListener("keydown", function (event) {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    socket.emit("txtmsg", { room, message: editor.value });
  }, 10);
});

const username = sessionStorage.getItem("username");
if (username == null) {
  window.location.href = "/";
}
const room = window.location.pathname.slice(1);
socket.emit("joinRoom", { room, username });

socket.on("userJoined", function (user) {
  if (user) {
    let li = document.createElement("li");
    li.innerHTML = user;
    document.getElementById("usersList").appendChild(li);
  }
});

socket.on("userLeft", (user) => {
  if (user) {
    let li = document.createElement("li");
    li.innerHTML = user;
    li.style.color = "red";
    document.getElementById("usersList").appendChild(li);
  }
});

socket.on("txtmsgres", function (message) {
  if (editor.value !== message) {
    editor.value = message;
  }
});
