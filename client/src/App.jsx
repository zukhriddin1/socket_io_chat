import React from "react";
import { useState, useEffect } from "react";

import { v4 as uuid } from "uuid";
import { Avatar, Badge, Button, TextField } from "@mui/material";

import { io } from "socket.io-client";
import styled from "@emotion/styled";
import { useMemo } from "react";

const socket = io("http://127.0.0.1:3000");

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px `,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const App = () => {
  const [text, setText] = useState("");
  const [user, setUser] = useState("");
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const msg = {
      id: uuid,
      from: user,
      to: currentChat,
      text,
      time: new Date().getTime(),
    };
    socket.emit("message", msg);

    setText("");
  };

  useEffect(() => {
    if (user) {
      (async () => {
        const res = await fetch("http://localhost:1993/users");
        const data = await res.json();
        setContacts(data?.filter((d) => d.id != user.id));
      })();
    }
  }, [user]);

  useEffect(() => {
    socket.on("message", (msg) => {
      console.log(msg);
      setNewMessage(msg);
    });
    socket.on("login", (users) => {
      setContacts(users);
    });
  }, [socket]);

  useEffect(() => {
    if (newMessage && user) {
      if (newMessage.from.id == user.id || newMessage.to.id == user.id) {
        setMessages((prev) => [...prev, newMessage]);
      }
    }
  }, [newMessage]);

  useEffect(() => {
    if (currentChat) {
      const msgs = messages.filter(
        (msg) => msg.from.id == currentChat.id || msg.to.id == currentChat.id
      );
      setCurrentMessages(msgs);
    }
  }, [messages]);

  const enter = (e) => {
    if (e.key == "Enter" && e.target.value != "") {
      const new_user = {
        name: e.target.value,
        id: uuid(),
      };
      setUser(new_user);
      socket.emit("login", new_user);
    }
  };
  const startChat = (contact) => {
    setCurrentChat(contact);
    const msgs = messages.filter(
      (msg) => msg.from.id == contact.id || msg.to.id == contact.id
    );
    setCurrentMessages(msgs);
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => contact.id != user?.id);
  }, [contacts]);
  return (
    <>
      <h2 style={{ textAlign: "center" }}>{user.name}</h2>
      <div className="app">
        <div className="chat-container">
          {user ? (
            <>
              <div className="users">
                {filteredContacts.map((contact) => (
                  <div
                    onClick={() => startChat(contact)}
                    className={`contact ${
                      contact.id === currentChat?.id && "active"
                    }`}
                    key={contact.id}
                  >
                    {contact.is_online ? (
                      <StyledBadge
                        overlap="circular"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        variant="dot"
                      >
                        <Avatar alt="Remy Sharp" />
                      </StyledBadge>
                    ) : (
                      <Avatar alt="Remy Sharp" />
                    )}

                    <Badge
                      badgeContent={messages?.reduce((acc, el) => {
                        return acc + (el.from.id == contact.id ? 1 : 0);
                      }, 0)}
                      color="primary"
                    >
                      {contact.name}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="chat">
                <div className="chat-content">
                  <div className="chat-header">{currentChat?.name}</div>
                  {currentMessages.map((message, i) => {
                    return (
                      <h2 key={i}>
                        {message.from.name}: {message.text}
                      </h2>
                    );
                  })}
                </div>
                <div>
                  <form onSubmit={submit} className="chat-form">
                    <TextField
                      value={text}
                      placeholder="Message..."
                      variant="outlined"
                      onChange={(e) => setText(e.target.value)}
                    ></TextField>
                    <Button type="primary" variant="contained">
                      SEND
                    </Button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="user-login">
              <TextField
                id="standard-basic"
                label="Login"
                onKeyDown={enter}
                variant="standard"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;
