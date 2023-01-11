import axios, {AxiosResponse} from "axios"
import config from "../config"
import qs from "qs"
import Class from "..";
import servers from "../models/servers";
import users from "../models/users";

/**
 * @param client - Client object.
 * @param {object} data - The data to send to the API.
 */
async function getTempToken (client: Class, data: { grant_type: string, client_id: string, client_secret: string }) {
    const res =  await axios.post(config.puffer.basePanelUrl + '/oauth2/token', qs.stringify(data)).catch((err: any) => {}) as AxiosResponse
    if (res.status === 200) {
        client.tempToken = res.data.access_token
        setTimeout(async () => await getTempToken(client, data), res.data.expires_in * 1000)
    } else {
        new Error('Impossible de récupérer le token temporaire.')
        process.exit()
    }
}

/**
 * @param data {object} - The data to send to the API.
 * @param {Class} client - Client object.
 * @return {object} - Return the user Object.
 */
async function newUser (client: Class, data: { "email": string, "id": number, "password": string, "username": string, "newPassword": string }) {
    return await axios.post(config.puffer.basePanelUrl + '/api/users', data, {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data)
}

/**
 * @param {Class} client - The client object.
 * @param data {any} - The data to send to the API.
 * @return {object} - Return the server Object.
 */
async function newServer (client: Class, data: any) {
    return await axios.put(config.puffer.basePanelUrl + `/api/servers/${data.id}`, data, {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data)
}

/**
 * @param {Class} client - The client object.
 * @param username {string} - The data to send to the API.
 * @return {Array} - Return the server Array.
 */
async function getUserServers (client: Class, username: string) {
    return await axios.get(config.puffer.basePanelUrl + `/api/servers?username=${encodeURI(username)}`, {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data)
}

/**
 * @param id {number} - The ID of the user.
 * @param {Class} client - Client object.
 * @return {object} - Return the user Object.
 */
async function getUser (client: Class, id: number) {
    return await axios.get(config.puffer.basePanelUrl + '/api/users/' + id, {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data)
}

/**
 * @param {Class} client - The client object.
 * @param id {string} - The ID of the server.
 */
async function getServer (client: Class, id: string) {
    return await axios.get(config.puffer.basePanelUrl + "/api/servers/" + id, {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data)
}

/**
 * @param {Class} client - The client object.
 * @param id {string} - The ID of the server.
 * @return {boolean} - Return true if the server is online.
 */
async function getServerStatus (client: Class, id: string) {
    return await axios.get(config.puffer.basePanelUrl + "/proxy/daemon/server/" + id + "/status", {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data.running)
}

/**
 * @param {Class} client - The client object.
 * @param id {string} - The ID of the server.
 * @return {string} - Return true if the server is online.
 */
async function getServerConsole (client: Class, id: string) {
    return await axios.get(config.puffer.basePanelUrl + "/proxy/daemon/server/" + id + "/console", {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res && res.data && res.data.logs ? res.data.logs : 'Console vide.')
}

/**
 * @param {Class} client - The client object.
 * @param id {string} - The ID of the server.
 * @return {object} - Return server stats.
 */
async function getServerStats (client: Class, id: string) {
    return await axios.get(config.puffer.basePanelUrl + "/proxy/daemon/server/" + id + "/stats", {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data)
}

/**
 * @param {Class} client - The client object.
 * @param id {string} - The ID of the server.
 */
async function killServer (client: Class, id: string) {
    return await axios.post(config.puffer.basePanelUrl + "/proxy/daemon/server/" + id + "/kill", {}, {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data)
}

/**
 * @param {Class} client - The client object.
 * @param id {string} - The ID of the server.
 */
async function startServer (client: Class, id: string) {
    return await axios.post(config.puffer.basePanelUrl + "/proxy/daemon/server/" + id + "/start", {}, {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data)
}

/**
 * @param {Class} client - The client object.
 * @param id {string} - The ID of the server.
 * @return {boolean} - Return true if the server is installed.
 */
async function installServer (client: Class, id: string) {
    return await axios.post(config.puffer.basePanelUrl + "/proxy/daemon/server/" + id + "/install", {}, {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => true).catch(err => false)
}
/*
/**
 * @param {Class} client - The client object.
 * @param id {string} - The ID of the server.
 * @return {boolean} - Return true if the server is installed.
 \*\/
async function suspendServer (client: Class, id: string) {
    const server = await servers.findOne({id: id})
    if (!server) return false;
    if (server.suspended) return false;
    const user = await users.findOne({id: server.owner})
    if (!user) return false;

    const userPuffer = await getUser(client, user.id)
    if (!userPuffer) return false;

    return await axios.delete(config.puffer.basePanelUrl + "/api/servers/" + id + "/users/" + encodeURI(userPuffer.email), {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => true).catch(err => console.error(err))
}
*/

/**
 * @param {Class} client - The client object.
 * @param id {string} - The ID of the server.
 * @return {boolean} - Return true if the server is installed.
 */
async function deleteServer (client: Class, id: string) {
    return await axios.delete(config.puffer.basePanelUrl + "/api/servers/" + id, {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => true).catch(err => false)
}

/**
 * @param {Class} client - The client object.
 * @param id {number} - The ID of the user.
 * @return {boolean} - Return true if the server is installed.
 */
async function getUserPerms (client: Class, id: number) {
    return await axios.get(config.puffer.basePanelUrl + "/api/users/" + id + "/perms", {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data).catch(err => undefined)
}

/**
 * @param {Class} client - The client object.
 * @return {[object]} - Return all users.
 */
async function getUsers (client: Class) {
    return await axios.get(config.puffer.basePanelUrl + "/api/users", {
        headers: {Authorization: `Bearer ${client.tempToken}`, ContentType: 'application/json'}
    }).then(res => res.data.users).catch(err => undefined)
}

export {
    getTempToken,
    newUser,
    newServer,
    getUserServers,
    getUser,
    getServer,
    getServerStatus,
    getServerConsole,
    getServerStats,
    killServer,
    startServer,
    installServer,
    //suspendServer,
    deleteServer,
    getUserPerms,
    getUsers
}