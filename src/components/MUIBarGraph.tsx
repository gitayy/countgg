import { Paper, Typography, LinearProgress } from "@mui/material";
import { BarChart } from '@mui/x-charts';



export function MUIBarGraph({ scores }) {
    if(scores && scores.length > 0) {
        return (
            <BarChart
      xAxis={[
        {
          id: 'barCategories',
          data: scores.map((_, index) => `${index}`),
          scaleType: 'band',
        },
      ]}
      series={[
        {
          data: scores,
        },
      ]}
    //   width={500}
      height={300}
    />
    //   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    //     {scores.map((score, index) => (
    //       <Paper key={index} elevation={3} style={{ width: '200px', marginBottom: '10px' }}>
    //         <Typography variant="caption" align="center" style={{ marginTop: '5px' }}>
    //           Index {index}
    //         </Typography>
    //         <LinearProgress variant="determinate" value={(score / 10) * 100} />
    //         <Typography variant="body2" align="center" style={{ marginBottom: '5px' }}>
    //           Score: {score}
    //         </Typography>
    //       </Paper>
    //     ))}
    //   </div>
    );} else { return <div></div>}
  }