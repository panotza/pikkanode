const logger = document.getElementById('logger')
const baseUrl = document.getElementById('base-url').value
let email, password, pikkaId, commentId

function log (s) {
  logger.innerText = s
}

function check (name) {
  document.getElementById(name).setAttribute('checked', true)
}

async function fetchApi (url, method, body) {
  const isObject = Object.prototype.toString.call(body) === '[object Object]'
  const opts = {
    method,
    credentials: 'include'
  }
  if (isObject) {
    opts.headers = {
      'content-type': 'application/json'
    }
  }
  opts.body = isObject ? JSON.stringify(body) : body

  const response = await fetch(baseUrl + url, opts)
  if (response.status === 404) {
    throw new Error('api not found')
  }
  try {
    const data = await response.json()
    return { status: response.status, data }
  } catch (err) {
    throw new Error('response body is not json')
  }
}

async function generateUser () {
  try {
    const response = await fetch('https://randomuser.me/api/?password=special,upper,lower,number&nat=us')
    const { results: [user] } = await response.json()
    email = user.email
    password = user.login.password
    console.log('email:', email)
    console.log('password:', password)
  } catch (err) {
    throw err
  }
}

async function testSignup () {
  const body = {
    email,
    password
  }

  let result = await fetchApi('/api/v1/auth/signup', 'POST', body)
  if (result.status !== 200) {
    return log('signup failed')
  }
  if (!result.data.userId) {
    return log('signup should return created user id')
  }

  result = await fetchApi('/api/v1/auth/signup', 'POST', body)
  if (result.status !== 400) {
    return log('signup should return status 400 when email already use')
  }
  if (!result.data.error || result.data.error !== 'email already used') {
    return log('signup should return "email already used"')
  }

  body.email = 'asdf'
  result = await fetchApi('/api/v1/auth/signup', 'POST', body)
  if (result.status !== 400) {
    return log('signup should return status 400 when email is invalid')
  }
  if (!result.data.error || result.data.error !== 'invalid email') {
    return log('signup should return "invalid email"')
  }

  body.email = email
  body.password = '12345'
  result = await fetchApi('/api/v1/auth/signup', 'POST', body)
  if (result.status !== 400) {
    return log('signup should return status 400 when password is too short')
  }
  if (!result.data.error || result.data.error !== 'password too short') {
    return log('signup should return "password too short"')
  }
  check('signup')
}

async function testSignin () {
  const body = {
    email,
    password
  }

  let result = await fetchApi('/api/v1/auth/signin', 'POST', body)
  if (result.status !== 200) {
    return log('signin failed')
  }

  body.password = '123123fsfsdf'
  result = await fetchApi('/api/v1/auth/signin', 'POST', body)
  if (result.status !== 400) {
    return log('signin should return status 400 when wrong email or password')
  }
  if (!result.data.error || result.data.error !== 'wrong email or password') {
    return log('signin should return "wrong email or password"')
  }

  check('signin')
}

async function testSignout () {
  let result = await fetchApi('/api/v1/auth/signout', 'POST')
  if (result.status !== 200) {
    return log('signout failed')
  }

  result = await fetchApi('/api/v1/auth/signout', 'POST')
  if (result.status !== 200) {
    return log('signout should return status 200 even call twice')
  }

  check('signout')
}

async function testPostPikka () {
  const pictureFile = document.getElementById('picture').files[0]
  const formData = new FormData()

  // authentication test
  let result = await fetchApi('/api/v1/pikka', 'POST', formData)
  if (result.status !== 401) {
    return log('post pikka should return 401 when unauthorized')
  }
  if (!result.data.error || result.data.error !== 'unauthorized') {
    return log('post pikka should return "unauthorized"')
  }

  // signin
  result = await fetchApi('/api/v1/auth/signin', 'POST', { email, password })
  if (result.status !== 200) {
    return log('signin failed')
  }

  // required field test
  formData.append('caption', 'test post pikka')
  result = await fetchApi('/api/v1/pikka', 'POST', formData)
  if (result.status !== 400) {
    return log('post pikka should return 400 when there is no picture')
  }
  if (!result.data.error || result.data.error !== 'picture required') {
    return log('post pikka should return "picture required"')
  }

  formData.delete('caption')
  formData.append('picture', pictureFile)
  result = await fetchApi('/api/v1/pikka', 'POST', formData)
  if (result.status !== 400) {
    return log('post pikka should return 400 when there is no caption')
  }
  if (!result.data.error || result.data.error !== 'caption required') {
    return log('post pikka should return "caption required"')
  }

  // test sucessful response
  formData.append('caption', 'test post pikka')
  result = await fetchApi('/api/v1/pikka', 'POST', formData)
  if (result.status !== 200) {
    return log('post pikka failed')
  }
  if (!result.data.id) {
    return log('post pikka should return created pikka id')
  }
  if (!result.data.createdAt) {
    return log('post pikka should return created time')
  }

  pikkaId = result.data.pikkaId
  check('post-pikka')
}

async function testListPikka () {
  let result = await fetchApi('/api/v1/pikka', 'GET')
  if (result.status !== 200) {
    return log('list pikka failed')
  }
  const { list } = result.data
  if (!list) {
    return log('list pikka should return key pikkas')
  }
  if (!Array.isArray(list)) {
    return log('list pikka should return pikkas as array')
  }
  if (list.length === 0) {
    return log('list pikka should return pikkas length > 0')
  }
  for (let pikka of list) {
    const { id, caption, picture, createdAt, commentCount, likeCount } = pikka
    if (!id) {
      return log('list pikka: pika should has id key')
    }
    if (!caption) {
      return log('list pikka: pika should has caption key')
    }
    if (!picture) {
      return log('list pikka: pika should has picture key')
    }
    if (!createdAt) {
      return log('list pikka: pika should has createdAt key')
    }
    if (commentCount === undefined) {
      return log('list pikka: pika should has commentCount key')
    }
    if (typeof commentCount !== 'number') {
      return log('list pikka: pika should has commentCount as number')
    }
    if (likeCount === undefined) {
      return log('list pikka: pika should has likeCount key')
    }
    if (typeof likeCount !== 'number') {
      return log('list pikka: pika should has likeCount as number')
    }
  }
  check('list-pikka')
}

async function testGetPikka () {
  let result = await fetchApi('/api/v1/pikka/' + pikkaId, 'GET')
  if (result.status !== 200) {
    return log('get pikka failed')
  }
  const { id, caption, picture, createdAt, likeCount, comments } = result.data
  if (id !== pikkaId) {
    return log('get pikka should return requested pikka correctly')
  }
  if (caption !== 'test post pikka') {
    return log('get pikka should return caption')
  }
  if (!picture) {
    return log('get pikka should return picture path')
  }
  if (!createdAt) {
    return log('get pikka should return created time')
  }
  if (likeCount === undefined) {
    return log('get pikka should return like count')
  }
  if (typeof likeCount !== 'number') {
    return log('get pikka should return like count as number')
  }
  if (!comments) {
    return log('get pikka should return comments')
  }
  if (!Array.isArray(comments)) {
    return log('get pikka should return comments as array')
  }
  check('get-pikka')
}

async function testPostComment () {
  const body = {
    text: 'test comment'
  }

  let result = await fetchApi('/api/v1/auth/signout', 'POST')
  if (result.status !== 200) {
    return log('signout failed')
  }

  // authentication test
  result = await fetchApi(`/api/v1/pikka/${pikkaId}/comment`, 'POST', body)
  if (result.status !== 401) {
    return log('comment pikka should return 401 when unauthorized')
  }
  if (!result.data.error || result.data.error !== 'unauthorized') {
    return log('comment pikka should return "unauthorized"')
  }

  // signin
  result = await fetchApi('/api/v1/auth/signin', 'POST', { email, password })
  if (result.status !== 200) {
    return log('signin failed')
  }

  // required field test
  result = await fetchApi(`/api/v1/pikka/${pikkaId}/comment`, 'POST', {})
  if (result.status !== 400) {
    return log('comment pikka should return 400 when there is no text')
  }
  if (!result.data.error || result.data.error !== 'text required') {
    return log('comment pikka should return "text required"')
  }

  // invalid id test
  result = await fetchApi(`/api/v1/pikka/999999999999/comment`, 'POST', body)
  if (result.status !== 400) {
    return log('comment pikka should return 400 when pikka not exists')
  }
  if (!result.data.error || result.data.error !== 'invalid request') {
    return log('comment pikka should return "invalid request"')
  }

  check('comment-pikka')
}

async function testPutLike () {
  let result = await fetchApi('/api/v1/auth/signout', 'POST')
  if (result.status !== 200) {
    return log('signout failed')
  }

  // authentication test
  result = await fetchApi(`/api/v1/pikka/${pikkaId}/like`, 'PUT')
  if (result.status !== 401) {
    return log('like pikka should return 401 when unauthorized')
  }
  if (!result.data.error || result.data.error !== 'unauthorized') {
    return log('like pikka should return "unauthorized"')
  }

  // signin
  result = await fetchApi('/api/v1/auth/signin', 'POST', { email, password })
  if (result.status !== 200) {
    return log('signin failed')
  }

  // invalid id test
  result = await fetchApi(`/api/v1/pikka/999999999999/like`, 'PUT')
  if (result.status !== 400) {
    return log('like pikka should return 400 when pikka not exists')
  }
  if (!result.data.error || result.data.error !== 'invalid request') {
    return log('like pikka should return "invalid request"')
  }

  check('like-pikka')
}

async function testPutUnLike () {
  let result = await fetchApi('/api/v1/auth/signout', 'POST')
  if (result.status !== 200) {
    return log('signout failed')
  }

  // authentication test
  result = await fetchApi(`/api/v1/pikka/${pikkaId}/like`, 'DELETE')
  if (result.status !== 401) {
    return log('like pikka should return 401 when unauthorized')
  }
  if (!result.data.error || result.data.error !== 'unauthorized') {
    return log('like pikka should return "unauthorized"')
  }

  // signin
  result = await fetchApi('/api/v1/auth/signin', 'POST', { email, password })
  if (result.status !== 200) {
    return log('signin failed')
  }

  // invalid id test
  result = await fetchApi(`/api/v1/pikka/999999999999/like`, 'DELETE')
  if (result.status !== 400) {
    return log('like pikka should return 400 when pikka not exists')
  }
  if (!result.data.error || result.data.error !== 'invalid request') {
    return log('like pikka should return "invalid request"')
  }

  check('unlike-pikka')
}

document.getElementById('test-btn').addEventListener('click', async () => {
  if (document.getElementById('picture').files.length === 0) {
    return alert('select photo before being the test')
  }
  document.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false })
  try {
    await generateUser()
    await testSignup()
    await testSignin()
    await testSignout()
    await testPostPikka()
    await testListPikka()
    await testGetPikka()
    await testPostComment()
    await testPutLike()
    await testPutUnLike()
  } catch (err) {
    log(err.message)
  }
})
