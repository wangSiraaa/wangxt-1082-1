import type { Library } from '../types';

export const initialLibraries: Library[] = [
  {
    id: 'lib001',
    name: '中心馆',
    address: '文化路88号儿童活动中心1楼',
    manager: '李馆长',
    phone: '010-88880001',
    createdAt: '2025-01-10'
  },
  {
    id: 'lib002',
    name: '城东分馆',
    address: '东城区朝阳路156号社区中心2楼',
    manager: '王馆长',
    phone: '010-88880002',
    createdAt: '2025-03-15'
  },
  {
    id: 'lib003',
    name: '城西分馆',
    address: '西城区学院路268号教育中心3楼',
    manager: '张馆长',
    phone: '010-88880003',
    createdAt: '2025-06-20'
  }
];

export default initialLibraries;
