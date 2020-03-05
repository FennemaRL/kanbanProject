import React, { Component, useState } from "react";
import {
  SortableContainer,
  SortableElement,
  SortableHandle
} from "react-sortable-hoc";
import { Link } from "react-router-dom";
import arrayMove from "array-move";
import tc from "./trash-can.svg";
import "./boards.css";
import axios from "axios";
import UpdateRes from "./updateRes";
let styleLi = {
  textDecoration: "none",
  color: "white",
  flex: " 0 1 18%",
  margin: "30px",
  padding: "8px",
  height: "90px",
  borderRadius: "5px",

  boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.75)",
  backgroundColor: "#B0BEC5"
};
const NewBoard = props => {
  let hefinput = React.createRef();
  const [display, setDisplay] = useState(false);
  return (
    <li style={styleLi}>
      <p
        style={{ marginTop: "12px", display: display ? "none" : "" }}
        onClick={() => {
          setDisplay(true);
        }}
      >
        add new board
      </p>
      <div style={{ display: !display ? "none" : "" }}>
        <p>Title : </p>
        <input
          ref={hefinput}
          style={{
            height: "15px",
            width: "90%",
            marginTop: "5px",
            borderRadius: "5px",
            padding: "5px"
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "98%"
          }}
        >
          <button
            style={{
              flex: 0.62,
              margin: "8px 0",
              height: "30px",
              borderRadius: "3px",
              border: "none",
              color: "white",
              backgroundColor: "#1A7737"
            }}
            onClick={() => {
              if (hefinput.current.value) {
                let title = hefinput.current.value;
                hefinput.current.value = "";
                setDisplay(false);
                props.onCreateBoard(title);
              }
            }}
          >
            Add
          </button>
          <button
            style={{
              flex: 0.33,
              height: "30px",
              margin: "8px 0",
              borderRadius: "3px",
              border: "none",
              color: "white",
              backgroundColor: "#CC161C"
            }}
            onClick={() => {
              hefinput.current.value = "";
              setDisplay(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </li>
  );
};
const DragHandle = SortableHandle(() => {
  let inputRef = React.createRef();
  return (
    <span ref={inputRef} title="Drag to order">
      :::
    </span>
  );
});
const SortableList = SortableContainer(
  ({ items, removeBoard, onCreateBoard }) => {
    return (
      <ul style={{ display: "flex", flexWrap: "wrap" }}>
        {items.map((value, index) => (
          <SortableItem
            removeBoard={removeBoard}
            key={`item-${value + index}`}
            index={index}
            value={value}
          />
        ))}
        <NewBoard onCreateBoard={onCreateBoard} />
      </ul>
    );
  }
);

const SortableItem = SortableElement(({ value, removeBoard }) => {
  const [trashCanState, setTrashCanState] = useState(false);
  return (
    <li
      tabIndex={value}
      style={{ ...styleLi, position: "relative" }}
      onMouseEnter={() => setTrashCanState(true)}
      onMouseLeave={() => setTrashCanState(false)}
    >
      {trashCanState && (
        <img
          src={tc}
          className="trashCan"
          title="remove board"
          style={{
            height: "15px",
            width: "15px",
            position: "absolute",
            top: "6px",
            right: "6px"
          }}
          alt=""
          onClick={() => {
            removeBoard(value);
          }}
        />
      )}
      <DragHandle />
      <Link to={`/board/${value}`}>
        <h3 style={{ marginTop: "12px" }}>{value}</h3>
        <div style={{ display: "flex" }}>
          <div
            style={{
              height: "35px",
              width: "15px",
              margin: "2px",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: "2px"
            }}
          />
          <div
            style={{
              height: "25px",
              width: "15px",
              margin: "2px",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: "2px"
            }}
          />
          <div
            style={{
              height: "15px",
              width: "15px",
              margin: "2px",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: "2px"
            }}
          />
        </div>
      </Link>
    </li>
  );
});

class Boards extends Component {
  constructor(props) {
    super(props);
    this.state = {
      boardsObs: [],
      firstFetch: false,
      errMessage: "",
      user: {
        userName: localStorage.getItem("UserName") || "Test"
      }
    };
    this.setState = this.setState.bind(this);
  }
  removeBoard = board => {
    let token = localStorage.getItem("UserToken");
    axios({
      url: `https://kanban-api-node.herokuapp.com/board/`,
      method: "DELETE",
      headers: { token: token },
      data: { boardTitle: board }
    })
      .then(res => this.setState({ message: "se borro exitosamente" }))
      .catch(err => this.setState({ message: err.response.data.message }));

    this.setState(prev => {
      let copy = [...prev.boardsObs];
      copy.splice(
        copy.findIndex(b => b === board),
        1
      );
      return { boardsObs: copy };
    });
  };

  removeBoard = this.removeBoard.bind(this);

  onSortEnd = ({ oldIndex, newIndex }) => {
    this.setState(({ boardsObs }) => {
      let token = localStorage.getItem("UserToken");
      let newOrder = arrayMove(boardsObs, oldIndex, newIndex);
      axios({
        url: `https://kanban-api-node.herokuapp.com/user/neworder`,
        method: "Patch",
        headers: { token: token },
        data: { boardsOrder: newOrder }
      })
        .then(res => this.setState({ message: "se reordeno exitosamente" }))
        .catch(err => this.setState({ message: err.message }));
      return { boardsObs: newOrder };
    });
  };
  createBoard = board => {
    let token = localStorage.getItem("UserToken");

    if (this.state.boardsObs.includes(board)) {
      this.setState({ message: "Existe una board con ese nombre" });
      return;
    }
    axios({
      url: `https://kanban-api-node.herokuapp.com/board`,
      method: "POST",
      headers: { token: token },
      data: { boardTitle: board }
    })
      .then(res => this.setState({ message: "se guardo exitosamente" }))
      .catch(err => this.setState({ message: err.message }));

    this.setState(prevs => {
      return {
        boardsObs: [...prevs.boardsObs, board]
      };
    });
  };
  componentDidMount() {
    if (!localStorage.getItem("UserToken")) {
      axios
        .post(`https://kanban-api-node.herokuapp.com/user/login`, {
          userName: process.env.REACT_APP_DEFAULT_USER,
          password: process.env.REACT_APP_DEFAULT_PASSWORD
        })
        .then(res => localStorage.setItem("UserToken", res.data.token))
        .catch(err => console.log(err.message));
    }
    if (!this.state.firstFetch) {
      axios
        .get(`https://kanban-api-node.herokuapp.com/user/Test`)
        .then(res => {
          this.setState({ boardsObs: res.data.boards, firstFetch: true });
        })
        .catch(err => console.log(err.message));
    }
  }
  render() {
    return (
      <>
        <UpdateRes message={this.state.message} />
        <div
          style={{
            minHeight: "89vh",
            minWidth: "70%",
            margin: "0 15%",
            paddingTop: "30px"
          }}
        >
          <SortableList
            items={this.state.boardsObs}
            onSortEnd={this.onSortEnd}
            useDragHandle={true}
            removeBoard={this.removeBoard}
            onCreateBoard={this.createBoard}
            axis="xy"
          />
        </div>
      </>
    );
  }
}

export default Boards;
