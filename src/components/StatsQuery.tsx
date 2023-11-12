import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../utils/contexts/SocketContext";
import { ThreadType } from "../utils/types";
import { SpeedTable } from "./SpeedTable";
import { Button, TextField } from "@mui/material";
import { SpeedTable2 } from "./SpeedTable2";
import { addCounterToCache } from "../utils/helpers";

interface Props {
    thread: ThreadType|{name: string, uuid: string};
  }
  

export const StatsQuery = ({ thread }: Props) => {

  const socket = useContext(SocketContext);

  const [customSpeed, setCustomSpeed] = useState<any>()
//   split_size, split_offset, min_posts_qualification
const [splitSize, setSplitSize] = useState<any>(1000)
  const [splitOffset, setSplitOffset] = useState<any>(0)
  const [minPostsQualification, setMinPostsQualification] = useState<any>(250)

  useEffect(() => {

    socket.emit('query_queue')

    socket.on('stats_results', function(data) {
        console.log(data);
        for (const counter of data.counters) {
            addCounterToCache(counter)
        }
        setCustomSpeed(data.results);
    });

    return () => {
      console.log("Disconnected: Disabling socket functions.");
        socket.emit('query_queue_leave')
        socket.off('stats_results');
    }
  }, [])


    return <>
    Splits
    <TextField
        sx={{ m: 2, minWidth: 200}}
        id="SplitSize"
        type="number"
        inputProps={{ min: "1", max: "50000000", step: "1" }}
        onInput={(e) => {
        const value = parseInt((e.target as HTMLInputElement).value || "0", 10);
        if (value >= 1 && value <= 50000000) {
            setSplitSize(value);
        }
        }}
        label="Split Size"
        InputLabelProps={{ shrink: true }}
        value={splitSize}
    />
    <TextField
        sx={{ m: 2, minWidth: 200}}
        id="SplitOffset"
        type="number"
        inputProps={{ min: "0", max: "50000000", step: "1" }}
        onInput={(e) => {
        const value = parseInt((e.target as HTMLInputElement).value || "0", 10);
        if (value >= 0 && value <= 50000000) {
            setSplitOffset(value);
        }
        }}
        label="Split Offset"
        InputLabelProps={{ shrink: true }}
        value={splitOffset}
    />
    <TextField
        sx={{ m: 2, minWidth: 200}}
        id="MinPostsQualification"
        type="number"
        inputProps={{ min: "1", max: "50000000", step: "1" }}
        onInput={(e) => {
        const value = parseInt((e.target as HTMLInputElement).value || "0", 10);
        if (value >= 1 && value <= 50000000) {
            setMinPostsQualification(value);
        }
        }}
        label="Min Posts Qualification"
        InputLabelProps={{ shrink: true }}
        value={minPostsQualification}
    />
    <Button variant="contained" onClick={() => {
        socket.emit('stats_splits', {thread_name: thread.name, split_size: splitSize, split_offset: splitOffset, min_posts_qualification: minPostsQualification})
    }}>Query</Button>
    {customSpeed && <SpeedTable2 thread={thread} speed={customSpeed} />}
    </>

}