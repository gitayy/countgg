import { useContext, useState } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { GmRoster } from '../components/GmRoster';
import { adminApproveCounter, adminApproveDiscord, adminDeny } from '../utils/api';
import { Box, Button, Container } from '@mui/material';
import { GridSelectionModel } from '@mui/x-data-grid';
import { Loading } from '../components/Loading';
import { useFetchUnapproved } from '../utils/hooks/useFetchUnapproved';

  export const AdminApprovePage = () => {
    const { counter, loading } = useContext(CounterContext);
    const [adminSelectionModel, setAdminSelectionModel] = useState<GridSelectionModel>([]);
    const { unapproved, unapprovedLoading } = useFetchUnapproved();

    async function makeCounter() {
      if(adminSelectionModel.length > 0) {
        const res = await adminApproveCounter(adminSelectionModel.map(String));
        console.log(res);
    }
    }

    async function makeDiscordVerified() {
      if(adminSelectionModel.length > 0) {
        const res = await adminApproveDiscord(adminSelectionModel.map(String));
        console.log(res);
    }
    }

    async function deny() {
      if(adminSelectionModel.length > 0) {
        const res = await adminDeny(adminSelectionModel.map(String));
        console.log(res);
    }
    }

    if(counter && counter.roles.includes('admin')) {
    return (<Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
        <>
        <GmRoster selection={adminSelectionModel} setSelection={setAdminSelectionModel} counter={counter} unapproved={unapproved}/>
        <Button onClick={makeCounter} sx={{m: 1, p: 1}} variant="contained">Make Counter</Button>
        <Button onClick={makeDiscordVerified} sx={{m: 1, p: 1}} variant="contained">Make Discord Verified</Button>
        <Button onClick={deny} sx={{m: 1, p: 1}} variant="contained">Deny</Button>
        </>
        {adminSelectionModel.map(val =><h1>UUID {val}</h1>)}
      </Box>
    )
    } else {
      return (<Loading />
      );
      }
  };
  