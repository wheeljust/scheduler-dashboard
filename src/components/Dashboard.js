// Libraries
import React, { Component } from "react";
import axios from "axios";
import classnames from "classnames";

// Helpers
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
} from "helpers/selectors";
import { setInterview } from "helpers/reducers";

// Components
import Loading from "./Loading";
import Panel from "./Panel";

// Data structure
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];

export default class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {}
  }

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  selectPanel(id) {
    this.setState(prevState => ({
      focused: (prevState.focused) ? null : id
    }));
  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
    });

    const panels = data
      .filter(panel => this.state.focused === null || this.state.focused === panel.id)
      .map(panel => {
        return (
          <Panel
            key={panel.id}
            id={panel.id}
            label={panel.label}
            value={panel.getValue(this.state)}
            onSelect={() => this.selectPanel(panel.id)}
          />
        );
      });

    if (this.state.loading) {
      return <Loading />;
    };

    return (
      <main className={dashboardClasses}>
        {panels}
      </main>
    );
  }
};
