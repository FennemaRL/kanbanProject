import React, { Component } from "react";
import {
  SortableContainer,
  SortableElement,
  SortableHandle
} from "react-sortable-hoc";
import { Link } from "react-router-dom";
import arrayMove from "array-move";
import tc from "../img/trash-can.svg";
import hand from "../img/grab.png";
import "./boards.css";
import axios from "axios";
import UpdateRes from "../nav/updateRes";
import BoardForm from "./boardForm";

const DragHandle = SortableHandle(() => {
  return (
    <span title="arrastrame para reordenar">
      <img src={hand} alt="arrastrame" />
    </span>
  );
});
const SortableList = SortableContainer(
  ({ items, removeBoard, onCreateBoard, setMessage }) => {
    return (
      <ul>
        {items.map((value, index) => (
          <SortableItem
            removeBoard={removeBoard}
            key={`item-${value + index}`}
            index={index}
            value={value}
          />
        ))}
        <li>
          <BoardForm onCreateBoard={onCreateBoard} setMessage={setMessage} />
        </li>
      </ul>
    );
  }
);

const SortableItem = SortableElement(({ value, removeBoard }) => {
  return (
    <li tabIndex={value} /*position relative */>
      <div className="board">
        <img
          src={tc}
          className="trashCan boardhide boardt"
          title="remove board"
          alt=""
          onClick={() => {
            removeBoard(value);
          }}
        />
        <DragHandle />
        <Link to={`/reacllo/board/${value}`}>
          <h4 style={{ marginTop: "12px" }}>{value}</h4>
          <div style={{ display: "flex" }}>
            <div className="row" />
            <div className="row" />
            <div className="row" />
          </div>
        </Link>
      </div>
    </li>
  );
});

class Boards extends Component {
  constructor(props) {
    super(props);
    this.state = {
      boardsObs: [],
      firstFetch: true,
      message: props.location.message
    };
    this.setState = this.setState.bind(this);
  }

  errHandler = err => {
    localStorage.removeItem("UserToken");
    localStorage.removeItem("userName");
    if (err.response.status === 401) {
      this.setState({
        message:
          "La ultima accion no pudo guardarse debido a que los permisos del usuario caducaron, logueese nuevamente",
        firstFetch: true
      });
    }
  };

  removeBoard = board => {
    let token = localStorage.getItem("UserToken");
    let uri = process.env.REACT_APP_DEFAULT_URLBACKEND;
    axios({
      url: `${uri}/board/`,
      method: "DELETE",
      headers: { token: token },
      data: { boardTitle: board }
    })
      .then(res => this.setState({ message: "se borro exitosamente" }))
      .catch(err => this.errHandler(err));

    this.setState(prev => {
      let copy = [...prev.boardsObs];
      copy.splice(
        copy.findIndex(b => b === board),
        1
      );
      return { boardsObs: copy, message: "actualizando ..." };
    });
  };

  removeBoard = this.removeBoard.bind(this);

  onSortEnd = ({ oldIndex, newIndex }) => {
    this.setState(({ boardsObs }) => {
      let token = localStorage.getItem("UserToken");
      let newOrder = arrayMove(boardsObs, oldIndex, newIndex);
      let uri = process.env.REACT_APP_DEFAULT_URLBACKEND;
      axios({
        url: `${uri}/user/neworder`,
        method: "Patch",
        headers: { token: token },
        data: { boardsOrder: newOrder }
      })
        .then(res => this.setState({ message: "se reordeno exitosamente" }))
        .catch(err => this.errHandler(err));
      return { boardsObs: newOrder, message: "actualizando ..." };
    });
  };
  createBoard = board => {
    let token = localStorage.getItem("UserToken");

    if (this.state.boardsObs.includes(board)) {
      this.setState({ message: "Existe una board con ese nombre" });
      return;
    }
    let uri = process.env.REACT_APP_DEFAULT_URLBACKEND;
    axios({
      url: `${uri}/board`,
      method: "POST",
      headers: { token: token },
      data: { boardTitle: board }
    })
      .then(res => this.setState({ message: "se guardo exitosamente" }))
      .catch(err => this.errHandler(err));
    this.setState(prevs => {
      return {
        boardsObs: [...prevs.boardsObs, board],
        message: "actualizando ..."
      };
    });
  };

  _getToken() {
    if (!localStorage.getItem("UserToken")) {
      let uri = process.env.REACT_APP_DEFAULT_URLBACKEND;
      axios
        .post(`${uri}/user/login`, {
          userName: process.env.REACT_APP_DEFAULT_USER,
          password: process.env.REACT_APP_DEFAULT_PASSWORD
        })
        .then(res => localStorage.setItem("UserToken", res.data.token))
        .catch(err => console.log(err.message));
    }
  }
  _getBoards() {
    let user = localStorage.getItem("userName") || "Test";
    if (this.state.firstFetch) {
      let uri = process.env.REACT_APP_DEFAULT_URLBACKEND;
      axios
        .get(`${uri}/user/${user}`)
        .then(res => {
          this.setState({ boardsObs: res.data.boards, firstFetch: false });
        })
        .catch(err => console.log(err.message));
    }
  }
  componentDidMount() {
    this._getToken();
    this._getBoards();
  }
  componentDidUpdate() {
    this._getToken();
    this._getBoards();
  }
  render() {
    return (
      <>
        <UpdateRes message={this.state.message} />
        <div className="boardsContainer">
          <SortableList
            helperClass="sortableCursor"
            items={this.state.boardsObs}
            onSortEnd={this.onSortEnd}
            useDragHandle={true}
            removeBoard={this.removeBoard}
            onCreateBoard={this.createBoard}
            setMessage={messager => this.setState({ message: messager })}
            axis="xy"
          />
        </div>
      </>
    );
  }
}

export default Boards;
