import React, { useState, useEffect, useMemo } from 'react';
// 引入 Firebase 功能
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';

import {
  User,
  Users,
  Calendar as CalendarIcon,
  LayoutDashboard,
  Plus,
  Search,
  ChevronRight,
  Save,
  Heart,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  RefreshCcw,
  Activity,
  PlusCircle,
  Stethoscope,
  History,
  XCircle,
  Sparkles,
  Bot,
  Dumbbell,
  AlertCircle,
  FileText,
  ExternalLink,
  RotateCcw,
  Settings,
  MapPin,
  ClipboardList,
  Moon,
  HeartPulse,
  HelpCircle,
  Bone,
  Coffee,
  Briefcase,
  GraduationCap,
  Tag,
  Info,
  Image as ImageIcon,
} from 'lucide-react';

// ==========================================
// 🟢 本地圖片設定區 (Local Assets)
// ==========================================
// 請確認您已經將圖片拖入左側的 'public' 資料夾，並命名如下：

// 1. 公司 Logo (請將您的名片圖改名為 logo.png)
const LOGO_URL = '/logo.png';

// 2. 白卡人體圖 (請將您的白卡圖改名為 body.png)
const BODY_MAP_URL = '/body.png';

// ==========================================
// 🟢 Firebase 設定 (已保留您的金鑰)
// ==========================================
const firebaseConfig = {
  apiKey: 'AIzaSyAHeg4B4guV40-PHbDIM3ZMU-OdHZ5YOeM',
  authDomain: 'marksportsmassage-74d97.firebaseapp.com',
  projectId: 'marksportsmassage-74d97',
  storageBucket: 'marksportsmassage-74d97.firebasestorage.app',
  messagingSenderId: '1026822481213',
  appId: '1:1026822481213:web:92490a25f2d3b6fadc9154',
  measurementId: 'G-7KVB30PESZ',
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 輔助函式 ---
const calculateAge = (dob) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  return age >= 0 ? `(${age} 歲)` : '';
};
const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 - 22:00

// --- SVG 人體圖備案 (萬一 body.png 沒放進去時顯示) ---
const BodyMapSVG = () => (
  <div className="flex flex-col items-center justify-center h-64 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
    <ImageIcon size={48} className="mb-2 opacity-20" />
    <p className="text-xs">
      請將人體圖命名為 body.png
      <br />
      並拖入 public 資料夾
    </p>
  </div>
);

// --- 主程式 ---
export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [dbStatus, setDbStatus] = useState('connecting');

  // 1. 監聽雲端資料庫
  useEffect(() => {
    try {
      const unsubClients = onSnapshot(
        query(collection(db, 'clients'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          setClients(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setDbStatus('connected');
        },
        (error) => setDbStatus('error')
      );

      const unsubAppts = onSnapshot(
        collection(db, 'appointments'),
        (snapshot) => {
          setAppointments(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        }
      );

      const unsubCoaches = onSnapshot(collection(db, 'coaches'), (snapshot) => {
        const coachList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (coachList.length === 0)
          setCoaches([
            {
              id: 'default',
              name: 'Mark',
              role: '運動按摩師',
              specialty: '全身放鬆',
              photo: '',
            },
          ]);
        else setCoaches(coachList);
      });

      return () => {
        unsubClients();
        unsubAppts();
        unsubCoaches();
      };
    } catch (e) {
      setDbStatus('error');
    }
  }, []);

  // CRUD 功能
  const handleStartIntake = () => {
    setSelectedClient({
      name: '',
      phone: '',
      dob: '',
      gender: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      source: '',
      sourceDetail: '',
      needs: [],
      needsOther: '',
      medical: { internal: [], ortho: [], surgery: '' },
      lifestyle: { work: '', sleepHrs: '', alcohol: '否', smoke: '否' },
      exercise: { freq: '', types: [], other: '' },
      planRelief: '',
      planReset: '',
      planReady: '',
      sessionRecords: [],
      isDeleted: false,
      createdAt: new Date().toISOString(),
    });
    setCurrentView('intake');
  };

  const handleSaveClient = async (data) => {
    try {
      if (data.id) {
        const { id, ...updateData } = data;
        await updateDoc(doc(db, 'clients', id), updateData);
      } else {
        await addDoc(collection(db, 'clients'), data);
      }
      alert('儲存成功！');
      setCurrentView('clients');
    } catch (e) {
      alert('儲存失敗');
    }
  };

  const handleMoveToRecycleBin = async (e, client) => {
    e.stopPropagation();
    if (!window.confirm(`確定要將 ${client.name} 移至回收站嗎？`)) return;
    await updateDoc(doc(db, 'clients', client.id), {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });
  };

  const handleAddAppointment = async (apptData) => {
    const client = clients.find((c) => c.id === apptData.client);
    await addDoc(collection(db, 'appointments'), {
      clientId: apptData.client,
      clientName: client?.name || 'Unknown',
      date: apptData.date,
      time: apptData.time,
      coach: apptData.coach,
      isRecurring: apptData.isRecurring,
      dayOfWeek: new Date(apptData.date).getDay(),
    });
    alert('預約已新增');
  };

  const handleDeleteAppointment = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('確定要刪除此預約嗎？')) return;
    await deleteDoc(doc(db, 'appointments', id));
  };

  // --- 視圖組件 ---

  const CoachManagementView = () => {
    const [newCoach, setNewCoach] = useState({
      name: '',
      role: '運動按摩師',
      specialty: '',
      photo: '',
    });

    const addCoach = async () => {
      if (!newCoach.name) return;
      await addDoc(collection(db, 'coaches'), {
        name: newCoach.name,
        role: newCoach.role,
        specialty: newCoach.specialty,
        photo: newCoach.photo,
        joinedAt: new Date().toISOString(),
      });
      setNewCoach({ name: '', role: '運動按摩師', specialty: '', photo: '' });
    };

    const deleteCoach = async (id) => {
      if (!window.confirm('確定刪除此教練？')) return;
      await deleteDoc(doc(db, 'coaches', id));
    };

    return (
      <div className="space-y-6 animate-in fade-in">
        <h1 className="text-3xl font-bold text-[#4A4036] flex items-center gap-2">
          <Settings /> 教練管理
        </h1>
        <div className="bg-white p-6 rounded-[2rem] border border-[#E5DACE] shadow-sm max-w-2xl">
          {/* 新增教練表單 */}
          <div className="flex flex-col gap-3 mb-6 bg-[#FDFBF7] p-4 rounded-2xl border border-[#E5DACE]">
            <h3 className="text-sm font-bold text-[#A39171]">新增夥伴</h3>
            <div className="flex gap-2">
              <input
                value={newCoach.name}
                onChange={(e) =>
                  setNewCoach({ ...newCoach, name: e.target.value })
                }
                placeholder="姓名"
                className="flex-1 p-2 border rounded-xl text-sm"
              />
              <select
                value={newCoach.role}
                onChange={(e) =>
                  setNewCoach({ ...newCoach, role: e.target.value })
                }
                className="flex-1 p-2 border rounded-xl text-sm"
              >
                <option>運動按摩師</option>
                <option>健身教練</option>
                <option>物理治療師</option>
                <option>行政櫃台</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                value={newCoach.specialty}
                onChange={(e) =>
                  setNewCoach({ ...newCoach, specialty: e.target.value })
                }
                placeholder="專長 (如：肩頸放鬆、舉重)"
                className="flex-1 p-2 border rounded-xl text-sm"
              />
              {/* 教練照片欄位說明：這裡改為輸入本地檔名 */}
              <input
                value={newCoach.photo}
                onChange={(e) =>
                  setNewCoach({ ...newCoach, photo: e.target.value })
                }
                placeholder="照片檔名 (如: /mark.png)"
                className="flex-[2] p-2 border rounded-xl text-sm"
              />
            </div>
            <p className="text-[10px] text-stone-400 pl-1">
              💡 提示：請將照片拖入 public 資料夾，並在此輸入檔名 (例如
              /mark.png)
            </p>
            <button
              onClick={addCoach}
              className="w-full bg-[#A39171] text-white rounded-xl font-bold text-sm py-2 mt-2"
            >
              新增教練
            </button>
          </div>

          {/* 教練列表 */}
          <div className="space-y-3">
            {coaches.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center p-4 bg-white border border-[#E5DACE] rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 overflow-hidden border border-[#E5DACE] flex items-center justify-center">
                    {/* 這裡會自動讀取 public 資料夾內的圖片 */}
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="text-stone-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#4A4036]">
                      {c.name}{' '}
                      <span className="text-xs font-normal text-gray-400">
                        ({c.role})
                      </span>
                    </h3>
                    <p className="text-xs text-[#8E7D5D] flex items-center gap-1">
                      <GraduationCap size={12} /> {c.specialty || '無特別備註'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteCoach(c.id)}
                  className="text-rose-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const RecycleBinView = () => {
    const deletedClients = clients.filter((c) => c.isDeleted);
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        <h1 className="text-3xl font-bold text-[#4A4036] flex items-center gap-2">
          <Trash2 /> 回收站
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {deletedClients.map((c) => (
            <div
              key={c.id}
              className="bg-white p-6 rounded-[2rem] border border-dashed border-stone-300 opacity-70"
            >
              <h3 className="font-bold line-through">{c.name}</h3>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={async () => {
                    await updateDoc(doc(db, 'clients', c.id), {
                      isDeleted: false,
                    });
                  }}
                  className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl text-xs font-bold"
                >
                  還原
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('永久刪除？'))
                      await deleteDoc(doc(db, 'clients', c.id));
                  }}
                  className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-xl text-xs font-bold"
                >
                  永久刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ClientDetailView = ({ data, onSave, onCancel }) => {
    const [form, setForm] = useState(data);
    const [activeTab, setActiveTab] = useState('profile');
    const [newLog, setNewLog] = useState({
      date: new Date().toISOString().split('T')[0],
      coach: 'Mark',
      content: '',
      advice: '',
    });

    const updateField = (f, v) => setForm((p) => ({ ...p, [f]: v }));
    const toggleArray = (f, i) => {
      const arr = form[f] || [];
      updateField(
        f,
        arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]
      );
    };
    const updateDeep = (c, f, v) =>
      setForm((p) => ({ ...p, [c]: { ...p[c], [f]: v } }));
    const toggleDeep = (c, f, i) => {
      const arr = form[c]?.[f] || [];
      const n = arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i];
      setForm((p) => ({ ...p, [c]: { ...p[c], [f]: n } }));
    };

    const addLog = () => {
      if (!newLog.content) return;
      setForm((p) => ({
        ...p,
        sessionRecords: [
          { ...newLog, id: Date.now() },
          ...(p.sessionRecords || []),
        ],
      }));
      setNewLog({ ...newLog, content: '', advice: '' });
    };

    return (
      <div className="space-y-6 pb-20 animate-in fade-in zoom-in-95">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-[#8E7D5D] font-bold"
          >
            <ArrowLeft size={18} /> 返回
          </button>
          <div className="flex bg-white p-1 rounded-2xl border border-[#E5DACE]">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#A39171] text-white'
                  : 'text-gray-400'
              }`}
            >
              白卡資料
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'logs'
                  ? 'bg-[#A39171] text-white'
                  : 'text-gray-400'
              }`}
            >
              課程紀錄
            </button>
          </div>
          <button
            onClick={() => onSave(form)}
            className="bg-[#A39171] text-white px-8 py-2.5 rounded-full shadow-lg font-bold flex items-center gap-2"
          >
            <Save size={18} /> 儲存
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className="bg-white rounded-[2rem] shadow-xl border border-[#E5DACE] overflow-hidden">
            <div className="bg-[#F7F2E9] p-8 border-b border-[#E5DACE]">
              <h1 className="text-3xl font-bold text-[#4A4036]">
                個人資料卡 Client Intake Form
              </h1>
            </div>
            <div className="p-8 md:p-12 space-y-12">
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-[#A39171]">
                    姓名
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full border-b border-[#E5DACE] py-1 bg-transparent outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-[#A39171]">
                    生日
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => updateField('dob', e.target.value)}
                    className="w-full border-b border-[#E5DACE] py-1 bg-transparent outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-[#A39171]">
                    電話
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full border-b border-[#E5DACE] py-1 bg-transparent outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-[#A39171]">
                    性別
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="w-full border-b border-[#E5DACE] py-1 bg-transparent outline-none"
                  >
                    <option value="">請選擇</option>
                    <option>男</option>
                    <option>女</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-[#A39171]">
                    地址
                  </label>
                  <input
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full border-b border-[#E5DACE] py-1 bg-transparent outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-[#A39171]">
                    緊急聯絡人
                  </label>
                  <input
                    value={form.emergencyContact}
                    onChange={(e) =>
                      updateField('emergencyContact', e.target.value)
                    }
                    className="w-full border-b border-[#E5DACE] py-1 bg-transparent outline-none"
                  />
                </div>

                {/* 來源欄位 */}
                <div className="col-span-1">
                  <label className="text-xs font-bold text-[#A39171] flex items-center gap-1">
                    <HelpCircle size={10} /> 如何得知我們?
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.source}
                      onChange={(e) => updateField('source', e.target.value)}
                      className="w-1/2 border-b border-[#E5DACE] py-1 bg-transparent outline-none text-xs"
                    >
                      <option value="">請選擇</option>
                      <option>親友介紹</option>
                      <option>社群軟體</option>
                      <option>網路搜尋</option>
                      <option>路過</option>
                      <option>其他</option>
                    </select>
                    <input
                      placeholder="詳細說明"
                      value={form.sourceDetail}
                      onChange={(e) =>
                        updateField('sourceDetail', e.target.value)
                      }
                      className="w-1/2 border-b border-[#E5DACE] py-1 bg-transparent outline-none text-xs"
                    />
                  </div>
                </div>
              </section>

              {/* 主要需求 */}
              <section className="bg-[#FDFBF7] p-6 rounded-3xl border border-[#E5DACE]">
                <h3 className="text-sm font-bold text-[#4A4036] mb-4 flex items-center gap-2">
                  <Activity size={16} /> 主要需求
                </h3>
                <div className="flex flex-wrap gap-4 items-center">
                  {[
                    '筋膜放鬆',
                    '運動恢復',
                    '舒緩疲勞',
                    '增肌減脂',
                    '體態評估',
                  ].map((i) => (
                    <label
                      key={i}
                      className={`px-4 py-2 rounded-xl border cursor-pointer text-sm ${
                        form.needs?.includes(i)
                          ? 'bg-[#A39171] text-white'
                          : 'bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={form.needs?.includes(i)}
                        onChange={() => toggleArray('needs', i)}
                      />
                      {i}
                    </label>
                  ))}
                  <input
                    placeholder="其他需求..."
                    value={form.needsOther}
                    onChange={(e) => updateField('needsOther', e.target.value)}
                    className="border-b border-[#A39171] bg-transparent outline-none text-sm px-2 py-1 min-w-[150px]"
                  />
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-[#E5DACE] shadow-sm">
                  {/* 醫療病史 */}
                  <h3 className="text-sm font-bold text-rose-800 mb-4 flex items-center gap-2">
                    <Stethoscope size={16} /> 健康狀況
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold text-[#A39171] mb-2 flex items-center gap-1">
                        <HeartPulse size={12} /> 內科
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          '高血壓',
                          '心臟病',
                          '糖尿病',
                          '氣喘',
                          '痛風',
                          '中風',
                          '懷孕',
                        ].map((i) => (
                          <label key={i} className="flex gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.medical?.internal?.includes(i)}
                              onChange={() =>
                                toggleDeep('medical', 'internal', i)
                              }
                              className="accent-[#A39171]"
                            />
                            {i}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-dashed border-[#E5DACE]">
                      <span className="text-xs font-bold text-[#A39171] mb-2 flex items-center gap-1">
                        <Bone size={12} /> 骨科
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          '關節炎',
                          '骨刺',
                          '椎間盤突出',
                          '脊椎滑脫',
                          '運動舊傷',
                        ].map((i) => (
                          <label key={i} className="flex gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.medical?.ortho?.includes(i)}
                              onChange={() => toggleDeep('medical', 'ortho', i)}
                              className="accent-[#A39171]"
                            />
                            {i}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#E5DACE] shadow-sm">
                  {/* 生活與運動 */}
                  <h3 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Coffee size={16} /> 生活與運動
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-[#A39171] mb-1 flex items-center gap-1">
                          <Briefcase size={12} /> 工作型態
                        </span>
                        <div className="flex gap-2 text-sm">
                          {['站立', '坐式', '不一定'].map((o) => (
                            <label key={o} className="flex gap-1">
                              <input
                                type="radio"
                                checked={form.lifestyle?.work === o}
                                onChange={() =>
                                  updateDeep('lifestyle', 'work', o)
                                }
                                className="accent-[#A39171]"
                              />
                              {o}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* 睡眠欄位 */}
                    <div>
                      <span className="text-xs font-bold text-[#A39171] mb-1 flex items-center gap-1">
                        <Moon size={12} /> 睡眠 (小時)
                      </span>
                      <input
                        value={form.lifestyle?.sleepHrs}
                        onChange={(e) =>
                          updateDeep('lifestyle', 'sleepHrs', e.target.value)
                        }
                        placeholder="建議填寫：時數 / 品質 (如：7小時，淺眠多)"
                        className="w-full border-b border-[#E5DACE] text-sm outline-none placeholder-stone-300"
                      />
                    </div>
                    {/* 運動項目 */}
                    <div className="pt-4 border-t border-dashed border-[#E5DACE]">
                      <span className="text-xs font-bold text-[#A39171] mb-2 flex items-center gap-1">
                        <Dumbbell size={12} /> 運動項目
                      </span>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {[
                          '健身',
                          '跑步',
                          '爬山',
                          '單車',
                          '有氧',
                          '瑜珈',
                          '在家運動',
                        ].map((i) => (
                          <label
                            key={i}
                            className={`px-3 py-1 rounded-full text-xs border cursor-pointer ${
                              form.exercise?.types?.includes(i)
                                ? 'bg-[#A39171] text-white'
                                : 'bg-gray-50 text-gray-500'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={form.exercise?.types?.includes(i)}
                              onChange={() =>
                                toggleDeep('exercise', 'types', i)
                              }
                            />
                            {i}
                          </label>
                        ))}
                      </div>
                      <input
                        placeholder="其他運動..."
                        value={form.exercise?.other}
                        onChange={(e) =>
                          updateDeep('exercise', 'other', e.target.value)
                        }
                        className="w-full border-b border-[#E5DACE] text-sm outline-none placeholder-stone-300"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 三階段調理計畫 */}
              <section className="bg-white p-6 rounded-3xl border border-[#E5DACE] shadow-sm">
                <h3 className="text-sm font-bold text-[#4A4036] mb-4 flex items-center gap-2">
                  <ClipboardList size={16} /> 專屬調理計畫 (Treatment Plan)
                </h3>
                <div className="space-y-4">
                  <div className="border border-[#E5DACE] rounded-xl p-4 bg-[#F9F9F9]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#4A4036]">
                        RELIEF (修復期)
                      </span>
                      <span className="text-xs text-[#8E7D5D]">
                        解除限制，處理張力
                      </span>
                    </div>
                    <textarea
                      value={form.planRelief}
                      onChange={(e) =>
                        updateField('planRelief', e.target.value)
                      }
                      className="w-full bg-transparent border-b border-dashed border-stone-300 outline-none text-sm min-h-[60px]"
                      placeholder="輸入課程規劃..."
                    />
                  </div>
                  <div className="border border-[#E5DACE] rounded-xl p-4 bg-[#F2F2F2]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#4A4036]">
                        ⚪ RESET (校正期)
                      </span>
                      <span className="text-xs text-[#8E7D5D]">
                        調整代償，重建動作
                      </span>
                    </div>
                    <textarea
                      value={form.planReset}
                      onChange={(e) => updateField('planReset', e.target.value)}
                      className="w-full bg-transparent border-b border-dashed border-stone-300 outline-none text-sm min-h-[60px]"
                      placeholder="輸入課程規劃..."
                    />
                  </div>
                  <div className="border border-[#E5DACE] rounded-xl p-4 bg-[#FFF5F5]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#4A4036]">
                        🔴 READY (強化期)
                      </span>
                      <span className="text-xs text-[#8E7D5D]">
                        功能整合，增加穩定
                      </span>
                    </div>
                    <textarea
                      value={form.planReady}
                      onChange={(e) => updateField('planReady', e.target.value)}
                      className="w-full bg-transparent border-b border-dashed border-stone-300 outline-none text-sm min-h-[60px]"
                      placeholder="輸入課程規劃..."
                    />
                  </div>
                </div>
              </section>

              {/* 人體圖 (支援本地圖片 / 預設 SVG) */}
              <section className="flex flex-col items-center pt-8 border-t border-[#E5DACE]">
                <h3 className="text-sm font-bold text-[#4A4036] mb-4">
                  不適部位標示 (Body Map)
                </h3>
                <div className="w-full max-w-md p-6 bg-[#FDFBF7] border border-[#E5DACE] rounded-xl relative flex justify-center">
                  {/* 邏輯：有設定 BODY_MAP_URL 就顯示圖片，否則顯示備案 SVG */}
                  {BODY_MAP_URL ? (
                    <img
                      src={BODY_MAP_URL}
                      alt="Body Map"
                      className="w-full h-auto opacity-90"
                    />
                  ) : (
                    <BodyMapSVG />
                  )}
                </div>
                <p className="text-center text-xs text-stone-400 mt-2">
                  請在諮詢時對照此圖進行評估 (正面/背面)
                </p>
              </section>

              {/* 價目表區塊 (紅色強調版 + 置中) */}
              <section className="bg-[#FDFBF7] p-8 rounded-[3rem] border border-[#E5DACE] space-y-8 mt-12">
                <div className="flex items-center gap-2 text-[#A39171] mb-2 border-b border-[#E5DACE] pb-4">
                  <Tag size={20} fill="currentColor" />
                  <h3 className="font-bold tracking-widest text-sm uppercase">
                    SERVICE MENU 服務價目表
                  </h3>
                </div>

                {/* 單次課程 (置中優化) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-[#E5DACE] shadow-sm flex flex-col items-center text-center">
                    <h4 className="text-lg font-bold text-[#4A4036] mb-1">
                      首次體驗 First Trial
                    </h4>
                    <div className="text-sm text-[#8E7D5D] mb-4">
                      限新客首購 (60-90分鐘)
                    </div>
                    <div className="text-2xl font-black text-rose-600">
                      NT$ 1,000
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      包含課程諮詢規劃、運動按摩、動作評估，無痛入門。
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-[#E5DACE] shadow-sm flex flex-col items-center text-center">
                    <h4 className="text-lg font-bold text-[#4A4036] mb-1">
                      單次課程 Single Session
                    </h4>
                    <div className="text-sm text-[#8E7D5D] mb-4">
                      針對當下問題處理
                    </div>
                    <div className="text-2xl font-black text-rose-600">
                      NT$ 1,500
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      全身平衡放鬆 / 全身張力調整。
                    </p>
                  </div>
                </div>

                {/* 長期方案 */}
                <div>
                  <h4 className="font-bold text-[#4A4036] mb-4 flex items-center gap-2">
                    ■ 長期優化方案 Packages
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-[#E5DACE] text-center">
                      <div className="font-bold text-[#4A4036] mb-1">
                        基礎 10 堂組
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        適合短期恢復 | 舒緩近期疲勞
                      </div>
                      <div className="text-xl font-black text-rose-600">
                        $14,500
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        平均 $1,450 / 堂
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-[#E5DACE] text-center">
                      <div className="font-bold text-[#4A4036] mb-1">
                        進階 20 堂組
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        適合定期保養 | 維持肌肉彈性
                      </div>
                      <div className="text-xl font-black text-rose-600">
                        $28,000
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        平均 $1,400 / 堂
                      </div>
                    </div>
                    <div className="bg-[#A39171] p-5 rounded-2xl border border-[#A39171] text-center text-white relative overflow-hidden shadow-lg transform hover:scale-105 transition-all">
                      <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 text-rose-700 rounded-bl-xl">
                        BEST
                      </div>
                      <div className="font-bold mb-1">長期 30 堂組</div>
                      <div className="text-xs opacity-80 mb-3">
                        體態平衡優化 | 建立長期習慣
                      </div>
                      <div className="text-xl font-black">$39,000</div>
                      <div className="text-[10px] opacity-80 mt-1">
                        平均 $1,300 / 堂 (最超值)
                      </div>
                    </div>
                  </div>
                </div>

                {/* 須知 */}
                <div className="bg-white p-6 rounded-2xl border border-dashed border-[#E5DACE] text-xs text-gray-500 space-y-2">
                  <div className="font-bold text-rose-700 mb-2 flex items-center gap-2">
                    <Info size={14} /> [預約須知 Notice]
                  </div>
                  <p>
                    •
                    課程時間：每堂60分鐘。堂數通用,單堂課程採「專項專用」(運動按摩/整合訓練擇一預約)。
                  </p>
                  <p>• 預約方式：採完全預約制，請提前透過 LINE 安排時間。</p>
                  <p>
                    • 服務據點：方塊先生肌力與體能中心 (臺南市北區北成路353號) /
                    台南地區到府服務。
                  </p>
                  <p>• 穿著建議：請穿著輕便、好活動的運動服裝。</p>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] shadow-xl border border-[#E5DACE] overflow-hidden min-h-[600px]">
            <div className="bg-[#A39171] p-10 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <History /> 課程紀錄追蹤表
              </h2>
            </div>
            <div className="p-8 md:p-12 space-y-10">
              <div className="bg-[#FDFBF7] p-8 rounded-[2.5rem] border-2 border-dashed border-[#E5DACE]">
                <h3 className="font-bold text-[#4A4036] mb-4 flex items-center gap-2">
                  <PlusCircle size={18} /> 新增紀錄
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#A39171] mb-1">
                      日期
                    </label>
                    <input
                      type="date"
                      value={newLog.date}
                      onChange={(e) =>
                        setNewLog({ ...newLog, date: e.target.value })
                      }
                      className="w-full p-3 border rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#A39171] mb-1">
                      當日負責教練
                    </label>
                    <select
                      className="w-full p-3 border rounded-xl text-sm"
                      value={newLog.coach}
                      onChange={(e) =>
                        setNewLog({ ...newLog, coach: e.target.value })
                      }
                    >
                      {coaches.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-[#A39171] mb-1">
                      施作內容 / SOAP Note
                    </label>
                    <input
                      value={newLog.content}
                      onChange={(e) =>
                        setNewLog({ ...newLog, content: e.target.value })
                      }
                      className="w-full p-3 border rounded-xl text-sm"
                      placeholder="輸入課程內容..."
                    />
                  </div>
                </div>
                <button
                  onClick={addLog}
                  className="mt-4 w-full py-3 bg-[#A39171] text-white rounded-xl font-bold"
                >
                  新增
                </button>
              </div>
              <div className="space-y-4">
                {(form.sessionRecords || []).map((log, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-[#E5DACE] rounded-2xl p-4"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-[#A39171] text-xs">
                        {log.date}{' '}
                        <span className="bg-[#F7F2E9] px-2 py-1 rounded ml-2 text-[#4A4036]">
                          教練: {log.coach}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm text-[#4A4036]">{log.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const StaffCalendar = () => {
    const [newData, setNewData] = useState({
      client: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      coach: 'Mark',
      isRecurring: false,
    });
    const weekDays = useMemo(
      () =>
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date(currentWeekStart);
          d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1) + i);
          return d;
        }),
      [currentWeekStart]
    );

    const jumpToDate = (e) => {
      const date = new Date(e.target.value);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      setCurrentWeekStart(new Date(date.setDate(diff)));
    };

    // 計算日曆顯示的日期範圍文字
    const getWeekRangeText = (startDate) => {
      const end = new Date(startDate);
      end.setDate(end.getDate() + 6);
      return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${
        end.getMonth() + 1
      }/${end.getDate()}`;
    };

    return (
      <div className="space-y-8 pb-20 animate-in slide-in-from-right-4">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#4A4036]">預約週排程</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-[#A39171]">
                快速跳轉:
              </span>
              <input
                type="date"
                onChange={jumpToDate}
                className="bg-transparent border-b border-[#A39171] text-xs outline-none"
              />
            </div>
          </div>
          <div className="flex bg-white rounded-xl border border-[#E5DACE]">
            <button
              onClick={() => {
                const d = new Date(currentWeekStart);
                d.setDate(d.getDate() - 7);
                setCurrentWeekStart(new Date(d));
              }}
              className="p-2 border-r hover:bg-stone-50"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-6 flex items-center text-sm font-bold text-[#4A4036] min-w-[140px] justify-center">
              {getWeekRangeText(currentWeekStart)}
            </div>
            <button
              onClick={() => {
                const d = new Date(currentWeekStart);
                d.setDate(d.getDate() + 7);
                setCurrentWeekStart(new Date(d));
              }}
              className="p-2 border-l hover:bg-stone-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        <div className="bg-white p-6 rounded-[2rem] border border-[#E5DACE] shadow-sm mb-6">
          <h3 className="font-bold text-[#4A4036] mb-4 flex items-center gap-2">
            <Plus size={18} /> 快速排程
          </h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] font-bold text-[#A39171] block mb-1">
                客戶
              </label>
              <select
                className="w-full p-2 border rounded-xl text-sm"
                value={newData.client}
                onChange={(e) =>
                  setNewData({ ...newData, client: e.target.value })
                }
              >
                <option value="">選擇客戶</option>
                {clients
                  .filter((c) => !c.isDeleted)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] font-bold text-[#A39171] block mb-1">
                教練
              </label>
              <select
                className="w-full p-2 border rounded-xl text-sm"
                value={newData.coach}
                onChange={(e) =>
                  setNewData({ ...newData, coach: e.target.value })
                }
              >
                {coaches.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] font-bold text-[#A39171] block mb-1">
                日期
              </label>
              <input
                type="date"
                value={newData.date}
                onChange={(e) =>
                  setNewData({ ...newData, date: e.target.value })
                }
                className="w-full p-2 border rounded-xl text-sm"
              />
            </div>
            <div className="flex-1 min-w-[80px]">
              <label className="text-[10px] font-bold text-[#A39171] block mb-1">
                時間
              </label>
              <select
                value={newData.time}
                onChange={(e) =>
                  setNewData({ ...newData, time: e.target.value })
                }
                className="w-full p-2 border rounded-xl text-sm"
              >
                {hours.map((h) => (
                  <option key={h} value={`${h < 10 ? '0' + h : h}:00`}>
                    {h}:00
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (newData.client) {
                  handleAddAppointment(newData);
                }
              }}
              className="px-6 py-2.5 bg-[#A39171] text-white rounded-xl font-bold"
            >
              確認
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-[#E5DACE] overflow-x-auto min-w-[800px]">
          <div className="grid grid-cols-8 bg-[#F7F2E9] border-b text-[10px] font-bold text-[#A39171] text-center">
            <div className="p-3 border-r">TIME</div>
            {weekDays.map((d) => (
              <div key={d.toString()} className="p-3 border-r">
                {['日', '一', '二', '三', '四', '五', '六'][d.getDay()]}{' '}
                {d.getDate()}
              </div>
            ))}
          </div>
          {hours.map((h) => (
            <div
              key={h}
              className="grid grid-cols-8 border-b border-[#F2EFE9] h-16 text-[10px]"
            >
              <div className="p-2 border-r text-center text-gray-300 font-bold">
                {h}:00
              </div>
              {weekDays.map((day, i) => {
                const dStr = day.toISOString().split('T')[0];
                const tStr = `${h < 10 ? '0' + h : h}:00`;
                const slots = appointments.filter(
                  (a) =>
                    (a.date === dStr ||
                      (a.isRecurring && a.dayOfWeek === day.getDay())) &&
                    a.time === tStr
                );
                return (
                  <div
                    key={i}
                    className="border-r p-1 flex flex-col gap-1 relative hover:bg-stone-50"
                  >
                    {slots.map((a) => (
                      <div
                        key={a.id}
                        className="p-1 rounded text-[9px] font-bold truncate bg-[#F2EFE9] text-[#4A4036] cursor-pointer border-l-2 border-[#A39171] relative group"
                      >
                        <span className="text-[#A39171] mr-1">[{a.coach}]</span>
                        {a.clientName}
                        <button
                          onClick={(e) => handleDeleteAppointment(e, a.id)}
                          className="absolute right-0 top-0 bottom-0 bg-rose-500 text-white px-2 hidden group-hover:flex items-center justify-center"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TallyEmbed = () => (
    <div className="h-full w-full bg-white rounded-[2rem] border border-[#E5DACE] overflow-hidden flex flex-col animate-in fade-in">
      <div className="bg-[#A39171] p-4 text-white flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2">
          <FileText /> 線上表單 (Tally)
        </h2>
        <a
          href="https://tally.so/r/2EKydb"
          target="_blank"
          className="text-xs bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-white/30"
        >
          <ExternalLink size={12} /> 開啟
        </a>
      </div>
      <iframe
        src="https://tally.so/r/2EKydb?transparentBackground=1"
        width="100%"
        height="100%"
        frameBorder="0"
        title="Tally Form"
        className="flex-grow"
      ></iframe>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] text-[#5D5245]">
      <aside className="w-20 md:w-64 bg-[#4A4036] text-white flex flex-col h-screen fixed left-0 top-0 z-30 transition-all">
        <div className="p-6 flex flex-col gap-1">
          <div className="w-20 h-20 bg-[#A39171] rounded-full text-white flex items-center justify-center mb-2 overflow-hidden border-2 border-[#E5DACE]">
            {LOGO_URL ? (
              <img
                src={LOGO_URL}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-xs p-2 text-center">
                MARK SPORTS MASSAGE
              </span>
            )}
          </div>
          <span className="font-black tracking-[0.2em] hidden md:block text-sm italic leading-tight">
            MARK
          </span>
          <span className="font-black tracking-[0.1em] hidden md:block text-xs opacity-70 leading-tight">
            SPORTS MASSAGE
          </span>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: '店務面板' },
            { id: 'clients', icon: Users, label: '個案中心' },
            { id: 'calendar', icon: CalendarIcon, label: '預約週曆' },
            { id: 'coaches', icon: Settings, label: '教練管理' },
            { id: 'recycleBin', icon: Trash2, label: '回收站' },
            { id: 'tally', icon: FileText, label: '線上表單' },
          ].map((i) => (
            <button
              key={i.id}
              onClick={() => setCurrentView(i.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                currentView === i.id ||
                (i.id === 'clients' &&
                  ['intake', 'clientDetail'].includes(currentView))
                  ? 'bg-[#A39171] shadow-xl'
                  : 'hover:bg-white/10 opacity-60'
              }`}
            >
              <i.icon size={20} />
              <span className="hidden md:block font-bold">{i.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto p-6 text-xs text-stone-500 text-center">
          {dbStatus === 'connected' ? (
            <span className="text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 size={12} /> 雲端已連線
            </span>
          ) : (
            <span className="animate-pulse">連線中...</span>
          )}
        </div>
      </aside>
      <main className="flex-grow ml-20 md:ml-64 p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in">
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-bold text-[#4A4036]">
                    系統總覽
                  </h1>
                  <p className="text-[#8E7D5D] mt-2">
                    活躍個案: {clients.filter((c) => !c.isDeleted).length} 筆
                  </p>
                </div>
                <button
                  onClick={handleStartIntake}
                  className="bg-[#A39171] text-white px-8 py-3 rounded-full shadow-lg font-bold hover:scale-105 transition-all flex items-center gap-2"
                >
                  <PlusCircle size={18} /> 新增個案
                </button>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5DACE] shadow-sm">
                  <p className="text-xs font-bold text-[#A39171] uppercase mb-2">
                    總個案
                  </p>
                  <p className="text-5xl font-black text-[#4A4036]">
                    {clients.filter((c) => !c.isDeleted).length}
                  </p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5DACE] shadow-sm">
                  <p className="text-xs font-bold text-[#A39171] uppercase mb-2">
                    總預約
                  </p>
                  <p className="text-5xl font-black text-[#4A4036]">
                    {appointments.length}
                  </p>
                </div>
                <div
                  className={`bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 flex flex-col items-center justify-center font-bold ${
                    dbStatus === 'connected'
                      ? 'text-emerald-700'
                      : 'text-stone-400'
                  }`}
                >
                  <CheckCircle2 size={32} className="mb-2" />{' '}
                  {dbStatus === 'connected' ? '雲端運作正常' : '等待連線...'}
                </div>
              </div>
            </div>
          )}
          {currentView === 'clients' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <h1 className="text-3xl font-bold text-[#4A4036]">個案中心</h1>
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="搜尋..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[#E5DACE] shadow-sm outline-none focus:ring-2 focus:ring-[#A39171]/20"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
                {clients
                  .filter(
                    (c) =>
                      !c.isDeleted &&
                      (c.name.includes(searchTerm) ||
                        c.phone.includes(searchTerm))
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedClient(c);
                        setCurrentView('clientDetail');
                      }}
                      className="bg-white p-6 rounded-[2rem] border border-[#E5DACE] hover:border-[#A39171] transition-all cursor-pointer shadow-sm group relative"
                    >
                      <div className="flex justify-between mb-2">
                        <div className="p-3 bg-[#F7F2E9] rounded-xl text-[#A39171] group-hover:bg-[#A39171] group-hover:text-white transition-all">
                          <User size={24} />
                        </div>
                        <span className="text-[10px] text-stone-400 font-bold">
                          {calculateAge(c.dob)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#4A4036]">
                        {c.name}
                      </h3>
                      <p className="text-xs text-stone-500 mb-4">
                        {c.phone || '無電話'}
                      </p>
                      <button
                        onClick={(e) => handleMoveToRecycleBin(e, c)}
                        className="absolute bottom-6 right-6 p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                        title="移至回收站"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {currentView === 'coaches' && <CoachManagementView />}
          {currentView === 'recycleBin' && <RecycleBinView />}
          {(currentView === 'intake' || currentView === 'clientDetail') && (
            <ClientDetailView
              data={selectedClient}
              onSave={handleSaveClient}
              onCancel={() => setCurrentView('clients')}
            />
          )}
          {currentView === 'calendar' && <StaffCalendar />}
          {currentView === 'tally' && <TallyEmbed />}
        </div>
      </main>
    </div>
  );
}
