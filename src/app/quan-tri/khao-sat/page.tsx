'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  Plus,
  ShieldCheck,
  RotateCcw,
  Calendar,
  AlertTriangle,
  User,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getSurveysAction,
  createSurveyAction,
  type SurveyItem,
} from '@/app/actions/admin-surveys';
import { getAdminHotspotsAction, type AdminHotspotItem } from '@/app/actions/admin-hotspots';
import { HOTSPOT_SEVERITY_META, type HotspotSeverity } from '@/types';

export default function AdminSurveysPage() {
  const { profile, isVerifier, isAdmin } = useAuth();
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [hotspots, setHotspots] = useState<AdminHotspotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState('');
  const [findings, setFindings] = useState('');
  const [riskLevel, setRiskLevel] = useState<HotspotSeverity>('attention_needed');
  const [recommendations, setRecommendations] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [survRes, hotRes] = await Promise.all([
        getSurveysAction(),
        getAdminHotspotsAction({
          publicationStatus: 'all',
          processingStatus: 'all',
          severity: 'all',
          includeDemo: true,
        }),
      ]);

      if (survRes.success && survRes.data) {
        setSurveys(survRes.data);
      }
      if (hotRes.success && hotRes.data) {
        setHotspots(hotRes.data);
        if (hotRes.data.length > 0 && !selectedHotspotId) {
          setSelectedHotspotId(hotRes.data[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedHotspotId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedHotspotId) return;
    setIsProcessing(true);

    try {
      const res = await createSurveyAction({
        hotspotId: selectedHotspotId,
        surveyorId: profile.id,
        surveyorName: profile.full_name || 'Cán bộ khảo sát',
        findings,
        recordedRiskLevel: riskLevel,
        recommendations,
        isDemo: true,
      });

      if (res.success) {
        setIsModalOpen(false);
        setFindings('');
        setRecommendations('');
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <h1 className="text-xl font-bold text-navy-950">
            Khảo sát Thực địa Hiện trường
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận kết quả khảo sát trực tiếp của cán bộ tại các vị trí xung quanh trường học. Đáp ứng điều kiện 1 để công khai Hotspot.
          </p>
        </div>

        {(isVerifier || isAdmin) && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Lập phiếu khảo sát mới</span>
          </button>
        )}
      </div>

      {/* Surveys List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Ngày khảo sát</th>
                <th className="p-3.5">Điểm Hotspot</th>
                <th className="p-3.5">Cán bộ thực hiện</th>
                <th className="p-3.5">Mức nguy cơ ghi nhận</th>
                <th className="p-3.5">Ghi nhận thực tế</th>
                <th className="p-3.5">Đề xuất giải pháp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Đang nạp dữ liệu khảo sát...</span>
                  </td>
                </tr>
              ) : surveys.length > 0 ? (
                surveys.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {s.survey_date}
                    </td>
                    <td className="p-3.5 font-bold text-navy-950">
                      {s.hotspot_name}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {s.surveyor_name}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.recorded_risk_level === 'high_risk'
                            ? 'bg-rose-100 text-rose-800'
                            : s.recorded_risk_level === 'attention_needed'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {HOTSPOT_SEVERITY_META[s.recorded_risk_level]?.label || s.recorded_risk_level}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs text-slate-700">
                      <p className="line-clamp-2 text-xs leading-relaxed" title={s.findings}>
                        {s.findings}
                      </p>
                    </td>
                    <td className="p-3.5 max-w-xs text-slate-500">
                      <p className="line-clamp-2 text-xs leading-relaxed" title={s.recommendations || undefined}>
                        {s.recommendations || '—'}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Chưa có phiếu khảo sát nào</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lập phiếu khảo sát */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-navy-950">
                Phiếu Khảo sát Hiện trường
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Chọn Điểm Hotspot khảo sát:
                </label>
                <select
                  value={selectedHotspotId}
                  onChange={(e) => setSelectedHotspotId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  {hotspots.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Ghi nhận thực tế tại hiện trường:
                </label>
                <textarea
                  rows={3}
                  required
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="VD: Lưu lượng phương tiện tăng đột biến vào 16:45 - 17:15..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mức độ nguy cơ đánh giá:
                </label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as HotspotSeverity)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="attention_needed">Cần chú ý</option>
                  <option value="high_risk">Nguy cơ cao</option>
                  <option value="surveyed_safe">Đã khảo sát, chưa ghi nhận nguy cơ</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Đề xuất kiến nghị giải pháp:
                </label>
                <textarea
                  rows={2}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="VD: Cần phối hợp đoàn thanh niên hướng dẫn học sinh..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !findings.trim()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold"
                >
                  {isProcessing ? 'Đang lưu...' : 'Lưu phiếu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
