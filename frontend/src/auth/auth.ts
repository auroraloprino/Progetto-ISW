const USERS_KEY = "auth_users"
const SESSION_KEY = "auth_session"

export interface User {
  username: string
  email: string
  password: string
  profileImage?: string
}

export function getUsers():User[]{
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
}

export function saveUsers(u:User[]){
  localStorage.setItem(USERS_KEY, JSON.stringify(u))
}

export function register(user: User) {
  const users = getUsers()
  if (users.find(u => u.email === user.email)) return false
  if (users.find(u => u.username === user.username)) return false
  users.push(user)
  saveUsers(users)
  return true
}
export function login(email:string,password:string){
  const u = getUsers().find(u=>u.email===email && u.password===password)
  if(!u) return false
  localStorage.setItem(SESSION_KEY, JSON.stringify(u))
  return true
}

export function logout(){
  localStorage.removeItem(SESSION_KEY)
}

export function currentUser():User|null{
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")
}

export function updateUser(userData: Partial<User>): void {
  const user = currentUser()
  if (user) {
    const updatedUser = { ...user, ...userData }

    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))

    const users = getUsers()
    const userIndex = users.findIndex(
      u => u.username === user.username
    )

    if (userIndex !== -1) {
      users[userIndex] = updatedUser
      saveUsers(users)
    }
  }
}
