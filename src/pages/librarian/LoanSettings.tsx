import { useState } from 'react';
import { Settings, Save, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import PageHeader from '@/components/PageHeader';

export default function LoanSettings() {
  const { settings, updateSettings } = useAppStore();
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const settingsList = [
    {
      icon: Clock,
      key: 'defaultLoanDays',
      label: '默认借阅天数',
      type: 'number',
      unit: '天',
      min: 1,
      max: 60,
      description: '新借阅的绘本默认借阅周期',
    },
    {
      icon: RefreshCw,
      key: 'allowRenewalTimes',
      label: '最大续借次数',
      type: 'number',
      unit: '次',
      min: 0,
      max: 5,
      description: '每本绘本最多可续借的次数',
    },
    {
      icon: AlertTriangle,
      key: 'overdueFinePerDay',
      label: '逾期罚款金额',
      type: 'number',
      unit: '元/天',
      min: 0,
      max: 10,
      step: 0.1,
      description: '逾期后每天产生的罚款金额',
    },
    {
      key: 'enableOverdueReminder',
      label: '逾期提醒通知',
      type: 'switch',
      description: '是否在绘本逾期时发送提醒通知',
    },
    {
      key: 'maxBorrowCount',
      label: '最大借阅数量',
      type: 'number',
      unit: '本',
      min: 1,
      max: 20,
      description: '每位家长最多可同时借阅的绘本数量（0表示不限制）',
    },
  ];

  return (
    <div>
      <PageHeader
        title="借期设置"
        subtitle="配置绘本借阅规则和参数"
        icon={<Settings className="w-6 h-6" />}
        action={
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            <Save className="w-4 h-4" />
            {saved ? '已保存' : '保存设置'}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {settingsList.map((setting) => {
            const Icon = setting.icon;
            const value = (formData as any)[setting.key];

            return (
              <div key={setting.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start gap-4">
                  {Icon && (
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800">{setting.label}</h3>
                      {setting.type === 'switch' ? (
                        <button
                          onClick={() => setFormData({...formData, [setting.key]: !value})}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            value ? 'bg-indigo-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            value ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type={setting.type}
                            min={setting.min}
                            max={setting.max}
                            step={(setting as any).step}
                            value={value ?? ''}
                            onChange={(e) => {
                              const val = setting.type === 'number' 
                                ? (e.target.value === '' ? 0 : parseInt(e.target.value))
                                : e.target.value;
                              setFormData({...formData, [setting.key]: val});
                            }}
                            className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                          <span className="text-sm text-gray-500">{setting.unit}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">当前借阅规则预览</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">默认借阅周期</span>
                <span className="font-semibold">{formData.defaultLoanDays} 天</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">最多续借次数</span>
                <span className="font-semibold">{formData.allowRenewalTimes} 次</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">最长借阅周期</span>
                <span className="font-semibold">
                  {formData.defaultLoanDays * (formData.allowRenewalTimes + 1)} 天
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">逾期日罚款</span>
                <span className="font-semibold">¥{formData.overdueFinePerDay.toFixed(2)}/天</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">逾期提醒</span>
                <span className="font-semibold">{formData.enableOverdueReminder ? '已开启' : '已关闭'}</span>
              </div>
              {formData.maxBorrowCount && (
                <div className="flex items-center justify-between">
                  <span className="text-white/80">最大借阅数量</span>
                  <span className="font-semibold">{formData.maxBorrowCount} 本</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">业务规则说明</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>逾期未还的家长不能借阅新绘本</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>归还时发现破损的绘本将自动进入赔付流程</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>已赔付的记录不能修改破损原因</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>赔付金额根据破损程度按书价比例计算：轻微20%、严重60%、遗失100%</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>续借仅针对未逾期的绘本，逾期后无法续借</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
