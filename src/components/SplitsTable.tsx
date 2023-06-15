import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import { convertMsToFancyTime } from '../utils/helpers';

interface Props {
    splits: { number: string, split: number }[]|undefined;
}  

export const SplitsTable = ({ splits }: Props) => {
    if(splits !== undefined && splits.length > 0 ) {
        
          return (<>
            <Typography variant='h6'>Recent Splits</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                  <TableCell>Count</TableCell>
                    <TableCell>Split</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {splits.map((split, index) => (
                    <TableRow key={split.number}>
                      <TableCell component="th" scope="row">
                        {split.number}
                      </TableCell>
                      <TableCell>{convertMsToFancyTime(split.split)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </>
          );
    } else {
        return <></>;
    }
};