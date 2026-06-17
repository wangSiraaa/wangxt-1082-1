import type { FamilyMember } from '../types';

export const initialFamilyMembers: FamilyMember[] = [
  { id: 'me001', familyId: 'fm001', name: '陈爸爸', relationship: '爸爸', isPrimary: false, avatar: 'https://picsum.photos/seed/me001/100/100' },
  { id: 'me002', familyId: 'fm001', name: '陈妈妈', relationship: '妈妈', isPrimary: true, avatar: 'https://picsum.photos/seed/pt001/100/100' },
  { id: 'me003', familyId: 'fm001', name: '陈小明', relationship: '孩子', age: 4, isPrimary: false, avatar: 'https://picsum.photos/seed/me003/100/100' },
  { id: 'me004', familyId: 'fm001', name: '陈小红', relationship: '孩子', age: 6, isPrimary: false, avatar: 'https://picsum.photos/seed/me004/100/100' },
  { id: 'me005', familyId: 'fm002', name: '刘妈妈', relationship: '妈妈', isPrimary: true, avatar: 'https://picsum.photos/seed/pt002/100/100' },
  { id: 'me006', familyId: 'fm002', name: '刘小红', relationship: '孩子', age: 3, isPrimary: false, avatar: 'https://picsum.photos/seed/me006/100/100' },
  { id: 'me007', familyId: 'fm003', name: '王爸爸', relationship: '爸爸', isPrimary: true, avatar: 'https://picsum.photos/seed/pt003/100/100' },
  { id: 'me008', familyId: 'fm003', name: '王小华', relationship: '孩子', age: 5, isPrimary: false, avatar: 'https://picsum.photos/seed/me008/100/100' },
  { id: 'me009', familyId: 'fm004', name: '赵妈妈', relationship: '妈妈', isPrimary: true, avatar: 'https://picsum.photos/seed/pt004/100/100' },
  { id: 'me010', familyId: 'fm004', name: '赵小丽', relationship: '孩子', age: 2, isPrimary: false, avatar: 'https://picsum.photos/seed/me010/100/100' },
  { id: 'me011', familyId: 'fm005', name: '孙爸爸', relationship: '爸爸', isPrimary: true, avatar: 'https://picsum.photos/seed/pt005/100/100' },
  { id: 'me012', familyId: 'fm005', name: '孙小强', relationship: '孩子', age: 6, isPrimary: false, avatar: 'https://picsum.photos/seed/me012/100/100' },
  { id: 'me013', familyId: 'fm006', name: '周妈妈', relationship: '妈妈', isPrimary: true, avatar: 'https://picsum.photos/seed/pt006/100/100' },
  { id: 'me014', familyId: 'fm006', name: '周小美', relationship: '孩子', age: 4, isPrimary: false, avatar: 'https://picsum.photos/seed/me014/100/100' }
];

export default initialFamilyMembers;
