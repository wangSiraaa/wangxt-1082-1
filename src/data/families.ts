import type { Family } from '../types';

export const initialFamilies: Family[] = [
  {
    id: 'fm001',
    name: '陈家',
    primaryContactId: 'pt001',
    memberLevel: 'gold',
    borrowQuota: 15,
    currentBorrowed: 2,
    joinDate: '2025-06-15',
    address: '朝阳区阳光小区5号楼'
  },
  {
    id: 'fm002',
    name: '刘家',
    primaryContactId: 'pt002',
    memberLevel: 'silver',
    borrowQuota: 10,
    currentBorrowed: 1,
    joinDate: '2025-08-20',
    address: '海淀区花园小区3号楼'
  },
  {
    id: 'fm003',
    name: '王家',
    primaryContactId: 'pt003',
    memberLevel: 'normal',
    borrowQuota: 5,
    currentBorrowed: 2,
    joinDate: '2026-01-10',
    address: '丰台区幸福小区2号楼'
  },
  {
    id: 'fm004',
    name: '赵家',
    primaryContactId: 'pt004',
    memberLevel: 'silver',
    borrowQuota: 10,
    currentBorrowed: 1,
    joinDate: '2025-11-05',
    address: '东城区和平小区8号楼'
  },
  {
    id: 'fm005',
    name: '孙家',
    primaryContactId: 'pt005',
    memberLevel: 'gold',
    borrowQuota: 15,
    currentBorrowed: 2,
    joinDate: '2025-03-18',
    address: '西城区书香小区6号楼'
  },
  {
    id: 'fm006',
    name: '周家',
    primaryContactId: 'pt006',
    memberLevel: 'normal',
    borrowQuota: 5,
    currentBorrowed: 0,
    joinDate: '2026-02-22',
    address: '石景山区快乐小区1号楼'
  }
];

export default initialFamilies;
