import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {useEffect, useState} from "react";
import {Button, Box, Typography} from "@mui/material";
import Loader from '../components/utilities/loader';
import { useTheme } from '@mui/material/styles';
import NavbarLayout from '../layouts/Navbar';
import {useRouter} from "next/router";
import {faker} from "@faker-js/faker";
import ProductCard from "../components/ProductCard";
import axios from 'axios';
import { useSession } from 'next-auth/react';

export default function ExamplePage() {
  const router = useRouter();
  const theme = useTheme();   // To access universal theme
  const {data: session, status} = useSession();
  const [number, setNumber] = useState(1);    //Keeps track of number variable.  Modify using setNumber only.
  const [loading, setLoading] = useState(false);  // Keeps track of isLoading variable. Modify using setLoading only.
  const [token, setToken] = useState('');
  const [fakeData, setFakeData] = useState([]); // to keep track of fake products

  // This runs everytime when the component loads, and everytime the dependents 'loading' changes
  useEffect(() => {
    setNumber(number - 1);
  },[loading])

  // Need to create the fake data before components load or else race condition, do it in useEffect
  useEffect(() => {
    let fakeArray = [];
    for (let i = 0; i < 20; i++) {
      fakeArray.push(
        {
          id: i,
          name: faker.commerce.productName(),
          price: faker.commerce.price(),
          description: faker.lorem.paragraph()
        }
      )
    }
    setFakeData(fakeArray);
  }, [])


  // Helper function that a button can activate
  const handleClick = () => {
    setNumber(number + 1);
  }


  // Put the JSX HTML in the return.  Can put as many child components as you want.
  // Wrap all javascript with {} to separate it from the HTML
  return (
    <div className={styles.container}>
      <Head>
        <title>Example Page!</title>
        <meta name="description" content="Generated by create next app"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Example Page!
        </h1>
        <h2>
          {number}
        </h2>
        <Button
          variant="outlined"
          sx={{
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.secondary.main
            }
          }}
          onClick={handleClick}
        >
          Increase!
        </Button>

        <Button
          variant="outlined"
          color="warning"
          sx={{
            '&:hover': {
              backgroundColor: 'lightgrey'
            }
          }}
          onClick={() => setLoading(!loading)}
        >
          {/*This is an inline comment.*/}
          {/*You can use the below method to hide or show components based on a variable*/}
          {!loading && <a>Load</a>}
          {loading && <Loader contained size={150} color="#a8cac9"/>}
        </Button>

        <Typography sx={{mt: 5, '&:hover': {color: theme.palette.primary.main, cursor: 'pointer'}}}
                    variant="h6"
                    onClick={() => {
                      router.push("/exampleForm") // Redirects and puts a history item on the stack
                    }}>
          Click here for example form with Formik
        </Typography>

        <Typography sx={{mt: 10, '&:hover': {color: theme.palette.primary.main, cursor: 'pointer'}}}
                    variant="h3"
                    onClick={() => {
                      router.replace("/home")  // Redirects, but user cannot go back.
        }}>
          Click here to go to homepage
        </Typography>

        <Box sx={{width: '80%', maxWidth: '50%'}}>
          {session &&
            <Typography variant="subtitle1"> Google ID Token: {session.id_token}</Typography>
          }
        </Box>

        {/*To list out a list of components, use Map function on the array or object*/}
        {
          fakeData.map((item, key) => (
            <ProductCard
              key={item.id}
              name={item.name}
              description={item.description}
              price={item.price}
            />
          ))
        }

      </main>

    </div>
  )
}

// Add this to put the Navbar layout on this page
ExamplePage.getLayout = (page) => {
  return (
    <NavbarLayout>
      {page}
    </NavbarLayout>
  )
}