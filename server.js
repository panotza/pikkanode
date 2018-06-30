const Koa = require('koa')
const koaCors = require('@koa/cors')
const koaBody = require('koa-body')

const app = new Koa()
app.use(koaCors({ credentials: true }))
app.use(koaBody({ multipart: true }))
app.use(ctx => {
  console.log(ctx.request.body)
  console.log(ctx.request.files)
  ctx.status = 400
  ctx.body = {
    error: 'password too short'
  }
})

app.listen(8000)
