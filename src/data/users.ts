import type { User } from "../types";

export const initialUsers: User[] = [
  {
    id: "lib001",
    name: "李馆员",
    role: "librarian",
    avatar: "https://picsum.photos/seed/lib001/100/100",
    phone: "13800000001"
  },
  {
    id: "lib002",
    name: "王馆员",
    role: "librarian",
    avatar: "https://picsum.photos/seed/lib002/100/100",
    phone: "13800000002"
  },
  {
    id: "admin001",
    name: "张管理员",
    role: "admin",
    avatar: "https://picsum.photos/seed/admin001/100/100",
    phone: "13900000001"
  },
  {
    id: "pt001",
    name: "陈妈妈",
    role: "parent",
    avatar: "https://picsum.photos/seed/pt001/100/100",
    phone: "13700000001"
  },
  {
    id: "pt002",
    name: "刘妈妈",
    role: "parent",
    avatar: "https://picsum.photos/seed/pt002/100/100",
    phone: "13700000002"
  },
  {
    id: "pt003",
    name: "王爸爸",
    role: "parent",
    avatar: "https://picsum.photos/seed/pt003/100/100",
    phone: "13700000003"
  },
  {
    id: "pt004",
    name: "赵妈妈",
    role: "parent",
    avatar: "https://picsum.photos/seed/pt004/100/100",
    phone: "13700000004"
  },
  {
    id: "pt005",
    name: "孙爸爸",
    role: "parent",
    avatar: "https://picsum.photos/seed/pt005/100/100",
    phone: "13700000005"
  },
  {
    id: "pt006",
    name: "周妈妈",
    role: "parent",
    avatar: "https://picsum.photos/seed/pt006/100/100",
    phone: "13700000006"
  }
];

export default initialUsers;
