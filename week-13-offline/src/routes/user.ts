import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, verify, sign } from 'hono/jwt'
import { signupInput } from "@chandra_sekhar99/medium-common-v1";



export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
    },
    Variables: {
      userId: any
    }
  }>()


userRouter.post('/signup', async(c) => {
  
    const body = await c.req.json()
    const success = signupInput.safeParse(body)

    if(!success){
        c.status(411)
        return c.json({
            message: "Inputs not valid"
        })
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  try{
  
    const payload = await prisma.user.create({
      data:{
        username: body.username,
        password: body.password,
        name: body.name
      }
    })
    
    const jwt = await sign({
      id:payload.id
    },c.env.JWT_SECRET)
      return c.text(jwt)
  }
  
  catch(e){
      c.status(411)
      return c.text("Invalid req / something went wrong!!")
  }
  })
  
  
  userRouter.post('/signin', async (c) => {
    
    const body = await c.req.json()
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  try{
  
    const payload = await prisma.user.findUnique({
      where:{
        username: body.username,
        password: body.password,
      }
    })
  
    if(!payload){
      c.status(403);
      return c.json({
        "error": "Invalid credentials"
      })
    }
    
    const jwt = await sign({
      id:payload.id
    },c.env.JWT_SECRET)
      return c.text(jwt)
  }
  
  catch(e){
      c.status(411)
      return c.text("Invalid req / something went wrong!!")
  }
  })

  userRouter.use('/*',async (c,next) => {
      const authHeader = c.req.header("authorization") || "";
      const user = await verify(authHeader,c.env.JWT_SECRET);
  
      if(user){
          c.set("userId",user.id)
          await next()
      }
      else{
          c.status(403)
          return c.json({
              message: "You are not logged in"
          })
      }
  })
    


  userRouter.put('/updatecreds', async(c) => {

    const body = await c.req.json()
    const success = signupInput.safeParse(body)
    const userId = await c.get("userId")

    if(!success){
        c.status(411)
        return c.json({
            message: "Inputs not valid"
        })
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  try{
  
      const payload = await prisma.user.update({
      where:{
        id: Number(userId)
      },
      data:{
        username: body.username,
        password: body.password,
        name: body.name
      }
    })
    
    c.status(200)
    return c.json({
      message:"Creds updated"
    })
  }
  
  catch(e){
      c.status(411)
      return c.text("Something went wrong, unable to update!!")
  }
  })