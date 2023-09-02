import { LensTwoTone } from "@mui/icons-material";
import React, { useContext, useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cachedCounters } from "../utils/helpers";
import { UserContext } from "../utils/contexts/UserContext";
import moment from 'moment-timezone';
import { Counter } from "../utils/types";
import UserMultiSelect from "./UserMultiSelect";

const LeaderboardGraph = ({ stats, cum }) => {
let cumulativeTotals = {};
let dailyTotals = {};
let userStats = {};
let cumulativeSum = 0;

const {loading, counter} = useContext(UserContext);

const allUserUUIDs = stats && stats['all'] && stats['all']['leaderboard'] ? Object.keys(stats['all']['leaderboard']) : [];
// console.log("AYYYO");
// console.log(allUserUUIDs);


const [selectedCounters, setSelectedCounters] = useState<Counter[]>([]);
useEffect(() => {
    if(counter && !loading) {
        setSelectedCounters([counter]);
    }
}, [loading])

const handleSelectedUsersChange = (newSelectedUsers) => {
  setSelectedCounters(newSelectedUsers);
};

const sortedDates = Object.keys(stats).filter(date => date !== "all").sort(); // Sort the dates in ascending order
const firstDate = sortedDates[0];
const lastDate = sortedDates[sortedDates.length - 1];

const currentDate = moment(firstDate);
const endDate = moment(lastDate);

const allDates: any = [];

// for (const date of sortedDates) {
while (currentDate <= endDate) {
    // if(date === 'all') {continue;}
    const date = currentDate.format("YYYY-MM-DD");
  const leaderboard: Record<string, number> = stats[date] ? stats[date].leaderboard : {};
  for (const userUUID of allUserUUIDs) {
    const userScore = leaderboard[userUUID] ?? 0;

    if (!userStats[userUUID]) {
      userStats[userUUID] = {cum: 0};
    }

    if (!userStats[userUUID][date]) {
      userStats[userUUID][date] = {
        cumulative: 0,
        daily: 0,
      };
    }

    userStats[userUUID][date].daily += userScore; // Update daily score
    userStats[userUUID][date].cumulative = userStats[userUUID]['cum'] + userScore; // Update cumulative score
    userStats[userUUID]['cum'] += userScore;
  }
  const dailySum = Object.values(leaderboard).reduce((acc, value) => acc + value, 0);
  cumulativeSum += dailySum;
  
  cumulativeTotals[date] = cumulativeSum;
  dailyTotals[date] = dailySum;
  allDates.push(currentDate.format("YYYY-MM-DD"));
  currentDate.add(1, "day");
}
const chartData = Object.keys(cumulativeTotals).map((date) => ({
    date,
    ...cum && {cumulative: cumulativeTotals[date]},
    ...!cum && {daily: dailyTotals[date]},
  }));
  let userData: any = {};
  for (const userUUID in userStats) {
    const userEntry = userStats[userUUID];
    const userChartData = Object.keys(userEntry).map((date) => ({
      date,
      userUUID,
      daily: userEntry[date].daily,
      cumulative: userEntry[date].cumulative,
    }));
    
    userData[userUUID] = userChartData;
  }

  // console.log(userData[selectedCounter.uuid]);

  const userUUIDs = Object.keys(userStats);
  return (<>
  {/* <UserMultiSelect users={cachedCounters} selectedUsers={selectedCounters} onSelectedUsersChange={handleSelectedUsersChange} /> */}
    <ResponsiveContainer width="100%" aspect={2}>
        <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {cum && <Line type="monotone" dataKey="cumulative" stroke="#8884d8" />}
        {!cum && <Line type="monotone" dataKey="daily" stroke="#82ca9d" />}
        </LineChart>
    </ResponsiveContainer>
    {selectedCounters.map((selectedCounter) => (
      userData[selectedCounter.uuid] && (
        <ResponsiveContainer key={selectedCounter.uuid} width="100%" aspect={2}>
          <LineChart data={userData[selectedCounter.uuid]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {cum && <Line key={`cumulative-${selectedCounter.username}`} type="monotone" dataKey="cumulative" stroke={selectedCounter.color} name={selectedCounter.username} />}
            {!cum && <Line key={`daily-${selectedCounter.username}`} type="monotone" dataKey="daily" stroke={selectedCounter.color} name={selectedCounter.username} />}
          </LineChart>
        </ResponsiveContainer>
      )
    ))}
    {/* {selectedCounter && userData[selectedCounter] &&
    <ResponsiveContainer width="100%" aspect={2}>
        <LineChart data={userData[selectedCounter]}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {cum && <Line key={selectedCounter} type="monotone" dataKey="cumulative" stroke={cachedCounters[selectedCounter].color} name={cachedCounters[selectedCounter].username} />}
        {!cum && <Line key={selectedCounter} type="monotone" dataKey="daily" stroke={cachedCounters[selectedCounter].color} name={cachedCounters[selectedCounter].username} />}
        {userUUIDs.map(userUUID => (
          <Line key={userUUID} type="monotone" dataKey="daily" stroke={cachedCounters[userUUID].color} name={cachedCounters[userUUID].name} />
        ))} 
        </LineChart>
    </ResponsiveContainer>} */}
    </>
  );
};

export default LeaderboardGraph;