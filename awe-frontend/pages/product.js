import NavbarLayout from '../layouts/Navbar';
import ProductCard from '../components/ProductCard';
import ProductsBar from '../components/ProductsBar';
import * as React from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useSession } from 'next-auth/react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Container,
  Button,
  Divider,
  MenuItem,
  Select,
  Typography,
  Backdrop, Stack,
} from '@mui/material';
import RemovePostButton from '../components/admin/RemovePostButton';
import Loader from '../components/utilities/loader';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {updateAllAmounts} from '../actions/amounts';
import MessageModal from '../components/MessageModal';
import BackButton from "../components/utilities/BackButton";
import Head from "next/head";
import { TRIGGER_CART_UPDATE } from '../actions/types';
import { useMediaQuery } from '@mui/material';

/*
query:
{productId, postId, name, seller, description, price, quantity, picture, category}
 */

const CATEGORY_ID = {
  Electronics: 0,
  Clothing: 1,
  'Home and Kitchen': 2,
  Toys: 3,
  Books: 4,
  Supplements: 5,
  Drugs: 6,
  'Drinks and Food': 7,
  'Pets Good': 8,
  Others: 9,
};

export default function Product() {
  const theme = useTheme();
  const {data: session, status} = useSession();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [productData, setProductData] = useState({});
  const [productsInSameCategory, setProductsInSameCategory] = useState([]);
  const [productsBySameSeller, setProductsBySameSeller] = useState([]);
  const [quantitySelected, setQuantitySelected] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const amounts = useSelector(state => state.amounts);
  const cartQty = amounts.cartItems;
  const orderQty = amounts.orderItems;
  const listingQty = amounts.listingItems;
  const sellerPendingQty = amounts.pendingItems;
  const [isErrorOpen, setErrorOpen] = useState(false);

  const isScreenWidthLess1229 = useMediaQuery(theme.breakpoints.down('productDetailsDisplay'))
  const isScreenWidthLess767 = useMediaQuery(theme.breakpoints.down('productDetailsButtons'))

  useEffect(() => {
    setLoading(true)
    axios.post(
      '/api/products',
      {page: 1, productId: router.query.productId},
      {headers: {'Content-Type': 'application/json', 'authorization': session.id_token}}
    ).then((response) => {
      setProductData(response.data.items[0]);
      if (response.status === 200) {
        axios.post(
          '/api/products',
          {
            page: 1,
            categoryId: CATEGORY_ID[response.data.items[0].categoryId],
            status: 1,
            notProductId: router.query.productId
          },
          {headers: {'Content-Type': 'application/json', 'authorization': session.id_token}}
        ).then((response) => {
          setProductsInSameCategory(response.data.items.filter(item => item.status === 1))
        }).catch((error) => {
          console.log("failed to get items in the same category")
          console.log(error)
        })
        axios.post(
          '/api/products',
          {page: 1, sellerId: response.data.items[0].sellerId, status: 1, notProductId: router.query.productId},
          {headers: {'Content-Type': 'application/json', 'authorization': session.id_token}}
        ).then((response) => {
          setProductsBySameSeller(response.data.items.filter(item => item.status === 1))
        }).catch((error) => {
          console.log("failed to get items by same seller")
          console.log(error)
        })
        setLoading(false);
      }
    }).catch((err) => {
      setLoading(false);
      console.log(`Error in getting product ${JSON.stringify(err.response)}`);
    })
  }, [router.asPath])

  return (
    <>
      <Head>
        <title>AWExpress - Product</title>
        <meta name="product"/>
        <link rel="icon" href="/favicon.ico?v=2"/>
      </Head>
      <MessageModal open={isErrorOpen} setOpen={setErrorOpen}
                    subject='Oops!'
                    message='The quantity that you tried to add exceeds the available quantity of this item. You may already have this item in your cart.'
      />
      <Container 
        sx={{
          width: '70%',
          [theme.breakpoints.down('productDetailsContainerMedium')]: {
            width: '85%',
          },
          [theme.breakpoints.down('productDetailsContainerSmall')]: {
            width: '100%',
          },
        }}
      >
        {loading &&
          <Backdrop open={true} sx={{backgroundColor: "rgb(255, 255, 255, 0.6)", zIndex: 99}}>
            <Loader size={10} color={theme.palette.secondary.main}/>
          </Backdrop>
        }
        <BackButton/>
        <Stack id="main-product" direction={isScreenWidthLess1229 ? 'column' : 'row'} spacing={2}
               sx={{
                 bgcolor: 'white',
                 p: '20px',
                 borderRadius: '3px',
                //  minWidth: '1000px',
               }}
        >
          <Box sx={{display: 'flex', height: '100%', width: '100%', justifyContent: 'center'}}>
            <Box
              component='img'
              src={productData.picture}
              sx={{
                objectFit: 'contain',
                width: '300px',
                height: '350px',
              }}
            />
          </Box>
          <Stack direction="column" >
            <Typography sx={{fontSize: '36px', fontWeight: 'bold', color: theme.palette.secondary.main}}>
              {productData.productName}
            </Typography>
            <Typography sx={{fontSize: '18px', fontWeight: 'light'}}>
              Sold
              by: {productData.sellerFirstName} {productData.sellerLastName} {productData.sellerDepartment === "" ? null : "from " + productData.sellerDepartment}
            </Typography>
            <Divider sx={{mt: '8px', mb: '20px'}}/>
            <Typography sx={{fontSize: '16px', mb: '30px'}}>
              {productData.description}
            </Typography>
            <Typography variant="h4" sx={{mb: '50px'}}>
              ${productData.price}
            </Typography>
            <Box sx={{flexGrow: 1}}/>

            <Stack
              direction="row"
              spacing={3}
              sx={{
                justifyContent: 'flex-end',
                [theme.breakpoints.down('productDetailsButtons')]: {
                  justifyContent: 'flex-start'
                }
              }}
            >
              <Stack direction="column" spacing={1}>
                <Typography sx={{fontSize: '16px'}}>
                  Quantity
                </Typography>
                <Typography sx={{fontSize: '10px'}}>
                  {productData.availableQuantity} Available
                </Typography>
              </Stack>

              <Select
                defaultValue={1}
                sx={{width: '80px'}}
                onChange={(event) => setQuantitySelected(event.target.value)}
              >
                {[...Array(productData.availableQuantity).keys()].map((value, key) => {
                  return (
                    <MenuItem key={key} value={value + 1}>
                      {value + 1}
                    </MenuItem>
                  );
                })}
              </Select>
              {isScreenWidthLess767 ? null :
                <>
                  <Button
                    variant='outlined'
                    sx={{
                      width: '140px',
                      color: theme.palette.secondary.main,
                      borderColor: theme.palette.secondary.main,
                      '&:hover': {
                        backgroundColor: '#f0f0f0',
                        borderColor: theme.palette.secondary.main
                      }
                    }}
                    onClick={() => {
                      axios.post(
                        `/api/user/${user.userId}/cart`,
                        {
                          productId:
                          productData.productId,
                          quantity: quantitySelected,
                        },
                        {
                          headers: {
                            'Content-Type': 'application/json',
                            authorization: session.id_token,
                          }
                        }
                      ).then((response) => {
                        dispatch(updateAllAmounts(user.userId, session.id_token));
                      }).catch((error) => {
                        if (error.response.status === 409) {
                          console.log('quantity: ' + error.response.data['quantity']);
                          axios.patch(
                            `/api/user/${user.userId}/cart/${productData.productId}`,
                            {quantity: quantitySelected + error.response.data['quantity']},
                            {
                              headers: {
                                'Content-Type': 'application/json',
                                authorization: session.id_token,
                              },
                            }
                          ).then((response) => {
                            dispatch({type: TRIGGER_CART_UPDATE})
                          }).catch((error) => {
                            console.log('the server could not process add-to-cart due to internal error');
                            console.log(error.response);
                            setErrorOpen(true)
                          });
                        } else {
                          console.log('the server could not process add-to-cart due to internal error');
                          console.log(error.response);
                          setErrorOpen(true)
                        }
                      });
                    }}
                  >
                  Add To Cart
                </Button>
                <Button
                  variant='contained'
                  sx={{
                    width: '140px',
                    color: theme.palette.secondary.contrastText,
                    bgcolor: theme.palette.secondary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.light,
                    }
                }}
                  onClick={() => {
                    axios.post(
                      `/api/user/${user.userId}/cart`,
                      {
                        productId:
                        productData.productId,
                        quantity: quantitySelected,
                      },
                      {
                        headers: {
                          'Content-Type': 'application/json',
                          authorization: session.id_token,
                        }
                      }
                    ).then((response) => {
                      console.log('item quantity has successfully been added to cart');
                      console.log(response);
                      router.push({pathname: '/cart'});
                    }).catch((error) => {
                      if (error.response.status === 409) {
                        console.log('quantity: ' + error.response.data['quantity']);
                        axios.patch(
                          `/api/user/${user.userId}/cart/${productData.productId}`,
                          {quantity: quantitySelected + error.response.data['quantity']},
                          {
                            headers: {
                              'Content-Type': 'application/json',
                              authorization: session.id_token,
                            },
                          }
                        ).then((response) => {
                          console.log('item quantity has successfully been updated');
                          console.log(response);
                          router.push({
                            pathname: '/cart',
                          });
                        }).catch((error) => {
                          console.log('the server could not process add-to-cart due to internal error');
                          console.log(error.response);
                          setErrorOpen(true)
                        });
                      } else {
                        console.log('the server could not process add-to-cart due to internal error');
                        console.log(error.response);
                        setErrorOpen(true)
                      }
                    });
                  }}
                >
                  Buy It Now
                </Button>
              </>
              }
            </Stack>
            {isScreenWidthLess767 == false ? null :
              <Stack direction='column' spacing={2}
                sx={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: '20px',
                }}
              >
                <Button
                  variant='outlined'
                  sx={{
                    width: '100%',
                    height: '50px',
                    color: theme.palette.secondary.main,
                    borderColor: theme.palette.secondary.main,
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                      borderColor: theme.palette.secondary.main
                    }
                  }}
                  onClick={() => {
                    axios.post(
                      `/api/user/${user.userId}/cart`,
                      {
                        productId:
                        productData.productId,
                        quantity: quantitySelected,
                      },
                      {
                        headers: {
                          'Content-Type': 'application/json',
                          authorization: session.id_token,
                        }
                      }
                    ).then((response) => {
                      console.log('item quantity has successfully been added to cart');
                      console.log(response);
                      dispatch(updateAllAmounts(user.userId, session.id_token));
                    }).catch((error) => {
                      if (error.response.status === 409) {
                        console.log('quantity: ' + error.response.data['quantity']);
                        axios.patch(
                          `/api/user/${user.userId}/cart/${productData.productId}`,
                          {quantity: quantitySelected + error.response.data['quantity']},
                          {
                            headers: {
                              'Content-Type': 'application/json',
                              authorization: session.id_token,
                            },
                          }
                        ).then((response) => {
                          dispatch({type: TRIGGER_CART_UPDATE})
                          console.log('item quantity has successfully been updated');
                          console.log(response);
                        }).catch((error) => {
                          console.log('the server could not process add-to-cart due to internal error');
                          console.log(error.response);
                          setErrorOpen(true)
                        });
                      } else {
                        console.log('the server could not process add-to-cart due to internal error');
                        console.log(error.response);
                        setErrorOpen(true)
                      }
                    });
                  }}
                >
                Add To Cart
              </Button>
              <Button
                variant='contained'
                sx={{
                  width: '100%',
                  height: '50px',
                  color: theme.palette.secondary.contrastText,
                  bgcolor: theme.palette.secondary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.secondary.light,
                  }
                }}
                onClick={() => {
                  axios.post(
                    `/api/user/${user.userId}/cart`,
                    {
                      productId:
                      productData.productId,
                      quantity: quantitySelected,
                    },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        authorization: session.id_token,
                      }
                    }
                  ).then((response) => {
                    router.push({pathname: '/cart'});
                  }).catch((error) => {
                    if (error.response.status === 409) {
                      console.log('quantity: ' + error.response.data['quantity']);
                      axios.patch(
                        `/api/user/${user.userId}/cart/${productData.productId}`,
                        {quantity: quantitySelected + error.response.data['quantity']},
                        {
                          headers: {
                            'Content-Type': 'application/json',
                            authorization: session.id_token,
                          },
                        }
                      ).then((response) => {
                        router.push({
                          pathname: '/cart',
                        });
                      }).catch((error) => {
                        console.log('the server could not process add-to-cart due to internal error');
                        console.log(error.response);
                        setErrorOpen(true)
                      });
                    } else {
                      console.log('the server could not process add-to-cart due to internal error');
                      console.log(error.response);
                      setErrorOpen(true)
                    }
                  });
                }}
              >
                Buy It Now
              </Button>
            </Stack>
            }
          </Stack>
        </Stack>
        {user.userType && user.userType === 'admin' &&
          <RemovePostButton productId={productData.productId} id_token={session.id_token}/>
        }

        <Stack direction='column' spacing={5} sx={{mt: '50px'}}>
          {productsBySameSeller.length > 0 &&
            <ProductsBar
              products={productsBySameSeller}
              title="Other Products By This Seller"
              subtitle={(productData.sellerFirstName || productData.sellerLastName) && `Browse other items from ${productData.sellerFirstName} ${productData.sellerLastName}`}
            />
          }

          {productsInSameCategory.length > 0 &&
            <ProductsBar
              products={productsInSameCategory}
              title="Similar Items"
              subtitle={`Browse other items in ${productData.categoryId}`}
            />
          }
        </Stack>

      </Container>
    </>
  );
}

Product.getLayout = (page) => {
  return <NavbarLayout>{page}</NavbarLayout>;
};
