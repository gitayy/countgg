import React, { useContext, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import Box from '@mui/material/Box';
import { UserContext } from '../utils/contexts/UserContext';
import { purchaseItem } from '../utils/api';

const ShopItemCard = ({ item }) => {
    const {user, counter, items} = useContext(UserContext);
  const [expanded, setExpanded] = useState(false);
  const isAffordable = user ? Number(item.price) <= Number(user.money) : false;
  const alreadyHasItem = user && items ? items.filter(it => it.id === item.id).length > 0 : false;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const buyItem = async () => {
    console.log("Buying item ", item.id);
    const res = await purchaseItem(item.id)
    .then(({ data }) => {
        console.log(data);
    })
    .catch((err) => {
        console.log(err);
    })
  }

  return (
    <Card variant="outlined" onClick={handleExpandClick}>
      <CardContent>
        <Typography variant="h1" gutterBottom sx={{textAlign: "center"}}>
          {item.name}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={`${Number(item.price).toLocaleString()}`}
            icon={<MonetizationOnIcon />}
            color={isAffordable ? 'primary' : 'warning'}
            variant="outlined"
            size="small"
          />
          <Chip
            label={alreadyHasItem ? 'Purchased' : "Buy"}
            color={alreadyHasItem ? 'info' : isAffordable ? 'success' : 'error'}
            variant={alreadyHasItem ? 'outlined' : isAffordable ? 'filled' : 'outlined'}
            size="small"
            sx={{ cursor: alreadyHasItem ? 'default' : isAffordable ? 'pointer' : 'not-allowed' }}
            onClick={alreadyHasItem ? undefined : isAffordable ? buyItem : undefined}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ShopItemCard;