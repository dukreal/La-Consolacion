// Every admin page, in one place. App.jsx loads this file only when an admin page is opened, so the
// admin code is a separate download that shop customers never get (it also keeps the main file small).
export { default as AddCustomOrder } from './AddCustomOrder'
export { default as AddProduct } from './AddProduct'
export { default as EditCustomOrder } from './EditCustomOrder'
export { default as EditProduct } from './EditProduct'
export { default as Inventory } from './Inventory'
export { default as Logs } from './Logs'
export { default as Orders } from './Orders'
export { default as Overview } from './Overview'
export { default as Users } from './Users'
export { default as WalkIn } from './WalkIn'
