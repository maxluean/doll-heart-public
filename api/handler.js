import {createHandler} from '../lib/handler.mjs';
export default {fetch:request=>createHandler(process.env)(request)};
