// Every call to the PHP backend goes through this helper.
//
//   api('/auth/me.php')                                     -> GET
//   api('/auth/login.php', { method: 'POST', body: {...} })  -> sends JSON (login, register, ...)
//   api('/cart/add-to-cart.php', { method: 'POST', form: {...} })
//                                                           -> sends form data, which is what
//                                                              PHP's $_POST reads (cart, orders)
const BASE = '/api'

export async function api(path, { method = 'GET', body, form } = {}) {
  const options = {
    method,
    credentials: 'include', // sends the PHP session cookie
  }

  if (form) {
    options.body = new URLSearchParams(form) // product_id=3&quantity=1
  } else if (body) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const res = await fetch(BASE + path, options)

  // The PHP endpoints always answer with JSON, even for errors (401, 422, ...),
  // so we return it and let each page read `success`, `error` or `errors`.
  try {
    return await res.json()
  } catch {
    throw new Error(`Server error (${res.status})`)
  }
}
