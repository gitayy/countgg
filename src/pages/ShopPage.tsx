import { Box, Card, CardContent, Chip, Grid, Typography, useTheme } from '@mui/material';
import { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFetchShop } from '../utils/hooks/useFetchShop';
import { UserContext } from '../utils/contexts/UserContext';
import { Loading } from '../components/Loading';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShopItemCard from '../components/ShopItemCard';

  export const ShopPage = () => {

    const location = useLocation();
    const {shopItems, shopItemsLoading} = useFetchShop();
    const {user, counter, loading, items, setItems} = useContext(UserContext);
    const theme = useTheme();
    useEffect(() => {
        document.title = `Shop | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);
      console.log("Shop Items");
      console.log(shopItems);
      
      return (
        <Box sx={{ bgcolor: 'primary.light', color: 'text.primary', flexGrow: 1, p: 2}}>
            <Typography sx={{mb: 1.5}} variant='h4'>Shop {user && <Chip
              icon={<MonetizationOnIcon style={{color: theme.palette.mode == 'dark' ? 'gold' : 'black'}} />}
              label={Number(user.money).toLocaleString()}
              size='medium'
              sx={{backgroundColor: theme.palette.mode == 'dark' ?  'rgba(255, 215, 0, 0.5)' : 'gold',
              '& .MuiChip-label': {
                height: '100%', 
                lineHeight: '250%'
              }
              }}
               />}</Typography>
            {!loading && user && <>
            <Typography sx={{mb: 1.5}} variant='h5'>Emojis</Typography>
            <Grid container spacing={2}>
        {shopItems.map(item => {
          if (item.category === 'emoji') {
            const isAffordable = Number(item.price) <= Number(user.money);

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={item.id}>
                <ShopItemCard item={item} />
                {/* <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {item.name}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {item.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={`${Number(item.price).toLocaleString()}`}
                      icon={<MonetizationOnIcon style={{}} />}
                      color={isAffordable ? 'primary' : 'warning'}
                      variant="outlined"
                      size="small"
                    />
                    {isAffordable ? (
                      <Chip
                        label="Buy"
                        color="success"
                        variant="filled"
                        size="small"
                        sx={{cursor: 'pointer'}}
                      />
                    ) : (
                      <Chip
                        label="Buy"
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{cursor: 'not-allowed'}}
                      />
                    )}
                    </Box>
                  </CardContent>
                </Card> */}
              </Grid>
            );
          }
          return null;
        })}
      </Grid>
      </>}
      {loading && <Loading />}
            </Box>
        )
    };

