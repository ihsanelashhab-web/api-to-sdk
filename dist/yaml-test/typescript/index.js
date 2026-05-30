"use strict";
// Auto-generated SDK for Demo API v1.0.0
// Do not edit manually
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getProducts = getProducts;
const BASE_URL = "https://api.example.com/v1";
async function request(method, path, body, params) {
    let url = BASE_URL + path;
    if (params) {
        const query = new URLSearchParams(params).toString();
        if (query)
            url += "?" + query;
    }
    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
}
/** Get all users */
async function getUsers(params) {
    return request("GET", `/users`, undefined, params);
}
/** Get all products */
async function getProducts() {
    return request("GET", `/products`);
}
