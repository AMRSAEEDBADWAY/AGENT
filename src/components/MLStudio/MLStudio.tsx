import { useState } from 'react';
import { UploadCloud, Activity, Table, Settings2, Play, Brain, BarChart3, Download, FlaskConical, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import client from '../../api/client';
import toast from 'react-hot-toast';

const COLORS = ['#1AFFA2', '#0D9488', '#22D3EE', '#38BDF8', '#FBBF24', '#F87171', '#34D399'];

export const MLStudio = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [targetCol, setTargetCol] = useState('');
  const [algo, setAlgo] = useState('random_forest');
  const [testSize, setTestSize] = useState(0.2);
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Predict state
  const [predictInputs, setPredictInputs] = useState<Record<string, string>>({});
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await client.post('/api/ml/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPreview(res.data);
      setResult(null);
      setPrediction(null);
      toast.success(`تم تحميل ${res.data.rows} صف و ${res.data.columns.length} عمود`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'خطأ في رفع الملف');
    }
  };

  const handleTrain = async () => {
    if (!preview || !targetCol) return;
    setTraining(true);
    setResult(null);
    setPrediction(null);
    try {
      const res = await client.post('/api/ml/train', {
        target_column: targetCol,
        algorithm: algo,
        test_size: testSize,
        data: preview.data,
      });
      setResult(res.data);
      // Initialize predict inputs with empty values for original features
      const inputs: Record<string, string> = {};
      (res.data.original_features || []).forEach((f: string) => {
        inputs[f] = '';
      });
      setPredictInputs(inputs);
      toast.success(`تم التدريب بنجاح! الدقة: ${(res.data.accuracy * 100).toFixed(1)}%`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'خطأ أثناء التدريب');
    }
    setTraining(false);
  };

  const handlePredict = async () => {
    if (!result?.model_id) return;
    setPredicting(true);
    setPrediction(null);
    try {
      // Convert string inputs to numbers where possible
      const features: Record<string, any> = {};
      for (const [key, val] of Object.entries(predictInputs)) {
        const num = Number(val);
        features[key] = !isNaN(num) && val.trim() !== '' ? num : val;
      }
      const res = await client.post('/api/ml/predict', {
        model_id: result.model_id,
        features,
      });
      setPrediction(res.data);
      toast.success('تم التنبؤ بنجاح!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'خطأ في التنبؤ');
    }
    setPredicting(false);
  };

  const handleDownloadModel = async () => {
    if (!result?.model_id) return;
    try {
      const res = await client.get(`/api/ml/download-model/${result.model_id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.model_id}_${result.algorithm}.joblib`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تحميل النموذج بنجاح!');
    } catch {
      toast.error('خطأ في تحميل النموذج');
    }
  };

  const handleExportReport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${result.algorithm}_${result.model_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تحميل التقرير!');
  };

  // Prepare chart data from result
  const featureData = result?.feature_importance
    ? Object.entries(result.feature_importance)
        .map(([name, value]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, value: Number(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  const confusionData = result?.confusion_matrix || [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
      <div className="text-center py-8">
        <h1 className="text-5xl font-black text-brand-primary neon-text mb-4 flex items-center justify-center gap-3">
          <Brain className="w-10 h-10" />
          مختبر تدريب النماذج
        </h1>
        <p className="text-text-muted text-lg">ارفع بياناتك، اختر الخوارزمية، وشاهد النتائج بصرياً</p>
      </div>

      {/* Upload Section */}
      <div className="glass-panel border-dashed border-brand-primary/20 rounded-[2rem] p-8 hover:border-brand-primary/40 transition">
        <h2 className="text-2xl font-bold text-brand-primary neon-text mb-6 flex items-center gap-2"><UploadCloud /> رفع البيانات</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <input type="file" accept=".csv" onChange={e => { setFile(e.target.files?.[0] || null); setPreview(null); setResult(null); setPrediction(null); }}
              className="block w-full text-sm text-text-muted file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:bg-brand-primary/10 file:border file:border-brand-primary/30 file:text-brand-primary file:font-bold file:cursor-pointer hover:file:bg-brand-primary/20 transition-all" />
          </div>
          <button onClick={handleUpload} disabled={!file}
            className="px-8 py-3 btn-neon-solid flex-shrink-0 font-bold overflow-hidden">
            رفع وتحليل
          </button>
        </div>
      </div>

      {/* Preview Table */}
      {preview && (
        <div className="glass-card rounded-[2rem] p-8 overflow-hidden">
          <h2 className="text-xl font-bold text-brand-primary mb-6 flex items-center gap-2"><Table className="text-brand-primary neon-text" /> معاينة البيانات ({preview.rows} صف × {preview.columns.length} عمود)</h2>
          <div className="overflow-x-auto rounded-xl border border-brand-primary/10 custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5">{preview.columns.map((c: string) => <th key={c} className="px-4 py-3 text-text-muted font-bold text-right">{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.preview?.slice(0, 5).map((row: any, i: number) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition">
                    {preview.columns.map((c: string) => <td key={c} className="px-4 py-2.5 text-white">{String(row[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Training Config */}
      {preview && (
        <div className="bg-bg-panel border border-white/5 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings2 className="text-amber-400" /> إعدادات التدريب</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2">العمود المستهدف (Target)</label>
              <select value={targetCol} onChange={e => setTargetCol(e.target.value)}
                className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-primary outline-none">
                <option value="">-- اختر --</option>
                {preview.columns.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2">الخوارزمية</label>
              <select value={algo} onChange={e => setAlgo(e.target.value)}
                className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-primary outline-none">
                <option value="random_forest">🌲 Random Forest</option>
                <option value="xgboost">⚡ XGBoost</option>
                <option value="lightgbm">💡 LightGBM</option>
                <option value="svm">🔹 SVM</option>
                <option value="logistic">📈 Logistic Regression</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2">نسبة الاختبار ({(testSize * 100).toFixed(0)}%)</label>
              <input type="range" min={0.1} max={0.5} step={0.05} value={testSize} onChange={e => setTestSize(parseFloat(e.target.value))}
                className="w-full accent-brand-primary mt-2" />
            </div>
          </div>
          <button onClick={handleTrain} disabled={training || !targetCol}
            className="mt-8 w-full py-4 bg-gradient-to-l from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg disabled:opacity-50 transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20">
            {training ? <><Activity className="animate-spin" /> جاري التدريب...</> : <><Play /> بدء التدريب</>}
          </button>
        </div>
      )}

      {/* Results with Charts */}
      {result && (
        <div className="space-y-6">
          {/* Accuracy Card */}
          <div className="bg-gradient-to-br from-brand-primary/20 to-pink-500/10 border border-brand-primary/30 rounded-3xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-right">
                <h2 className="text-2xl font-bold text-white mb-2">✅ نتائج التدريب</h2>
                <p className="text-text-muted">الخوارزمية: <span className="text-brand-primary font-bold">{result.algorithm}</span></p>
                <p className="text-text-muted">عينات التدريب: {result.train_samples} | الاختبار: {result.test_samples}</p>
              </div>
              <div className="text-center">
                <div className="text-6xl font-black text-white">{(result.accuracy * 100).toFixed(1)}%</div>
                <div className="text-brand-primary font-bold mt-1">دقة النموذج</div>
              </div>
            </div>
          </div>

          {/* Download & Export Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={handleDownloadModel}
              className="flex items-center justify-center gap-3 p-5 bg-bg-panel border border-brand-primary/20 rounded-2xl text-white font-bold hover:bg-brand-primary/10 hover:border-brand-primary/40 transition-all hover:scale-[1.02] active:scale-95 group">
              <Download size={22} className="text-brand-primary group-hover:animate-bounce" />
              <div className="text-right">
                <div className="text-lg">تحميل النموذج المتدرّب</div>
                <div className="text-xs text-text-muted font-normal">ملف .joblib جاهز للاستخدام في Python</div>
              </div>
            </button>
            <button onClick={handleExportReport}
              className="flex items-center justify-center gap-3 p-5 bg-bg-panel border border-white/10 rounded-2xl text-white font-bold hover:bg-white/5 hover:border-white/20 transition-all hover:scale-[1.02] active:scale-95 group">
              <BarChart3 size={22} className="text-amber-400 group-hover:animate-bounce" />
              <div className="text-right">
                <div className="text-lg">تحميل تقرير النتائج</div>
                <div className="text-xs text-text-muted font-normal">ملف JSON بكل تفاصيل التدريب</div>
              </div>
            </button>
          </div>

          {/* Feature Importance Chart */}
          {featureData.length > 0 && (
            <div className="bg-bg-panel border border-white/5 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><BarChart3 className="text-brand-primary" /> أهمية المتغيرات (Feature Importance)</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={featureData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis type="number" stroke="#888ea8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#888ea8" fontSize={11} width={120} />
                  <Tooltip contentStyle={{ background: '#131313', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} name="الأهمية">
                    {featureData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Confusion Matrix */}
          {confusionData.length > 0 && (
            <div className="bg-bg-panel border border-white/5 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">🔢 مصفوفة الالتباس (Confusion Matrix)</h3>
              <div className="flex justify-center">
                <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${confusionData.length}, 1fr)` }}>
                  {confusionData.map((row: number[], ri: number) =>
                    row.map((val: number, ci: number) => (
                      <div key={`${ri}-${ci}`}
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-lg transition"
                        style={{ background: `rgba(139, 92, 246, ${Math.min(val / Math.max(...confusionData.flat()), 1) * 0.8 + 0.1})` }}>
                        {val}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prediction / Test Section */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <FlaskConical className="text-cyan-400" />
              اختبار النموذج المتدرّب
            </h3>
            <p className="text-text-muted mb-6">أدخل القيم لكل متغير وشاهد نتيجة التنبؤ فوراً</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {(result.original_features || []).map((feat: string) => (
                <div key={feat}>
                  <label className="block text-sm font-bold text-text-muted mb-1.5">{feat}</label>
                  <input
                    type="text"
                    value={predictInputs[feat] || ''}
                    onChange={(e) => setPredictInputs(prev => ({ ...prev, [feat]: e.target.value }))}
                    placeholder={`أدخل قيمة ${feat}`}
                    className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder-text-muted/50 focus:ring-2 focus:ring-cyan-400 outline-none transition"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handlePredict}
              disabled={predicting || Object.values(predictInputs).every(v => !v.trim())}
              className="w-full py-4 bg-gradient-to-l from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-lg disabled:opacity-50 transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/20"
            >
              {predicting ? <><Activity className="animate-spin" /> جاري التنبؤ...</> : <><Send /> تنبؤ الآن</>}
            </button>

            {/* Prediction Result */}
            {prediction && (
              <div className="mt-6 p-6 bg-bg-dark/50 border border-cyan-400/20 rounded-2xl animate-in fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="text-brand-primary w-8 h-8" />
                  <div>
                    <div className="text-sm text-text-muted">النتيجة المتوقعة لـ <span className="text-cyan-400 font-bold">{prediction.target_column}</span></div>
                    <div className="text-3xl font-black text-white mt-1">{prediction.prediction}</div>
                  </div>
                </div>

                {/* Probabilities */}
                {prediction.probabilities && Object.keys(prediction.probabilities).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-sm font-bold text-text-muted mb-3">احتمالات كل فئة:</div>
                    <div className="space-y-2">
                      {Object.entries(prediction.probabilities)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([cls, prob]) => (
                          <div key={cls} className="flex items-center gap-3">
                            <span className="text-sm text-white font-medium w-32 truncate text-left">{cls}</span>
                            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${(prob as number) * 100}%`,
                                  background: (prob as number) > 0.5 ? 'linear-gradient(90deg, #1AFFA2, #0D9488)' : 'linear-gradient(90deg, #38BDF8, #818CF8)',
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-brand-primary w-16 text-left">
                              {((prob as number) * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
