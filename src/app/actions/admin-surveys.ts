'use server';

import { createClient } from '@supabase/supabase-js';
import type { HotspotSeverity } from '@/types';

export interface SurveyItem {
  id: string;
  hotspot_id: string;
  hotspot_name?: string;
  surveyor_id: string;
  surveyor_name?: string;
  survey_date: string;
  findings: string;
  recorded_risk_level: HotspotSeverity;
  recommendations?: string | null;
  is_demo: boolean;
  created_at: string;
}

const CANONICAL_DEMO_SURVEY: SurveyItem = {
  id: '00000000-0000-0000-0000-000000000301',
  hotspot_id: '00000000-0000-0000-0000-000000000101',
  hotspot_name: '[DEMO] Cổng chính đường Phạm Văn Thuận',
  surveyor_id: '00000000-0000-0000-0000-000000000011',
  surveyor_name: 'Thầy Nguyễn Văn A (Cán bộ Xác minh DEMO)',
  survey_date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
  findings: 'Ghi nhận nhiều phụ huynh dừng xe dưới lòng đường giờ tan học 16:45 gây cản trở phương tiện lưu thông.',
  recorded_risk_level: 'attention_needed',
  recommendations: 'Phối hợp đội cờ đỏ nhắc nhở và kiến nghị sơn vạch phân ô dừng xe đón học sinh.',
  is_demo: true,
  created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
};

export async function getSurveysAction(): Promise<{
  success: boolean;
  data?: SurveyItem[];
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: surveys } = await supabase
      .from('hotspot_surveys')
      .select('*')
      .order('survey_date', { ascending: false });

    const { data: hotspots } = await supabase.from('hotspots').select('id, name');
    const { data: profiles } = await supabase.from('profiles').select('id, full_name');

    const hotMap = new Map((hotspots || []).map((h) => [h.id, h.name]));
    const profMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

    let items: SurveyItem[] = (surveys || []).map((s) => ({
      ...s,
      hotspot_name: hotMap.get(s.hotspot_id) || 'Điểm Hotspot',
      surveyor_name: profMap.get(s.surveyor_id) || 'Cán bộ khảo sát',
    }));

    if (items.length === 0) {
      items = [CANONICAL_DEMO_SURVEY];
    }

    return { success: true, data: items };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi lấy phiếu khảo sát.',
    };
  }
}

export async function createSurveyAction(params: {
  hotspotId: string;
  surveyorId: string;
  surveyorName: string;
  findings: string;
  recordedRiskLevel: HotspotSeverity;
  recommendations?: string;
  isDemo?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const surveyId = crypto.randomUUID();

    const { error: insErr } = await supabase.from('hotspot_surveys').insert({
      id: surveyId,
      hotspot_id: params.hotspotId,
      surveyor_id: params.surveyorId,
      survey_date: new Date().toISOString().slice(0, 10),
      findings: params.findings.trim(),
      recorded_risk_level: params.recordedRiskLevel,
      recommendations: params.recommendations ? params.recommendations.trim() : null,
      is_demo: params.isDemo || false,
    });

    if (insErr) {
      return { success: false, error: insErr.message };
    }

    // Ghi audit log chuẩn schema M1
    await supabase.from('audit_logs').insert({
      actor_id: params.surveyorId,
      action: 'survey.create',
      object_type: 'survey',
      object_id: surveyId,
      new_value: {
        hotspot_id: params.hotspotId,
        recorded_risk_level: params.recordedRiskLevel,
      },
      reason: 'Cán bộ lập phiếu khảo sát thực địa hiện trường',
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi tạo phiếu khảo sát.',
    };
  }
}
