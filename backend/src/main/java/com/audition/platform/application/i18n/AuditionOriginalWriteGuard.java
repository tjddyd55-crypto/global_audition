package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionTextSnapshot;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.RecruitFieldCodes;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * 저장 요청의 번역 가능 필드가 원문과 같으면 쓰지 않는다.
 * 원문과 다르고 어떤 번역 오버레이와 같으면 그 필드는 무시한다.
 * 번역문을 원문 컬럼에 덮어쓰지 않기 위한 서버 가드다.
 */
public final class AuditionOriginalWriteGuard {

    private AuditionOriginalWriteGuard() {
    }

    public static boolean apply(Audition audition, UpdateAuditionRequest request, List<AuditionTextSnapshot> overlays) {
        List<AuditionTextSnapshot> rows = overlays == null ? List.of() : overlays;
        boolean changed = false;
        changed |= writeText(request.getTitle(), audition.getTitle(), texts(rows, AuditionTextSnapshot::getTitle), audition::setTitle);
        changed |= writeText(request.getDescription(), audition.getDescription(), texts(rows, AuditionTextSnapshot::getDescription), audition::setDescription);
        changed |= writeText(request.getLocation(), audition.getLocation(), texts(rows, AuditionTextSnapshot::getLocation), audition::setLocation);
        changed |= writeText(request.getAgencyName(), audition.getAgencyName(), texts(rows, AuditionTextSnapshot::getAgencyName), audition::setAgencyName);
        changed |= writeList(request.getRecruitFields(), audition.getRecruitFields(), arrays(rows, AuditionTextSnapshot::getRecruitFields), true, audition::setRecruitFields);
        changed |= writeList(request.getQualifications(), audition.getQualifications(), arrays(rows, AuditionTextSnapshot::getQualifications), false, audition::setQualifications);
        changed |= writeList(request.getSchedules(), audition.getSchedules(), arrays(rows, AuditionTextSnapshot::getSchedules), false, audition::setSchedules);
        changed |= writeList(request.getBenefits(), audition.getBenefits(), arrays(rows, AuditionTextSnapshot::getBenefits), false, audition::setBenefits);
        return changed;
    }

    private static boolean writeText(String incoming, String stored, List<String> overlays, Consumer<String> write) {
        if (incoming == null) {
            return false;
        }
        String next = incoming.trim();
        if (next.equals(clean(stored))) {
            return false;
        }
        if (!next.isEmpty() && overlays.stream().anyMatch(overlay -> next.equals(clean(overlay)))) {
            return false;
        }
        write.accept(next);
        return true;
    }

    private static boolean writeList(
            List<String> incoming,
            String[] stored,
            List<String[]> overlays,
            boolean recruitCodes,
            Consumer<String[]> write) {
        if (incoming == null) {
            return false;
        }
        String[] next = recruitCodes ? RecruitFieldCodes.normalizeAll(toArray(incoming)) : toArray(incoming);
        if (same(next, stored)) {
            return false;
        }
        if (next.length > 0 && overlays.stream().anyMatch(overlay -> same(next, overlay))) {
            return false;
        }
        write.accept(next);
        return true;
    }

    private static List<String> texts(List<AuditionTextSnapshot> rows, java.util.function.Function<AuditionTextSnapshot, String> read) {
        List<String> values = new ArrayList<>();
        for (AuditionTextSnapshot row : rows) {
            values.add(read.apply(row));
        }
        return values;
    }

    private static List<String[]> arrays(List<AuditionTextSnapshot> rows, java.util.function.Function<AuditionTextSnapshot, String[]> read) {
        List<String[]> values = new ArrayList<>();
        for (AuditionTextSnapshot row : rows) {
            values.add(read.apply(row));
        }
        return values;
    }

    private static String[] toArray(List<String> values) {
        List<String> kept = new ArrayList<>();
        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }
            kept.add(value.trim());
        }
        return kept.toArray(String[]::new);
    }

    private static boolean same(String[] left, String[] right) {
        return canonical(left).equals(canonical(right));
    }

    private static String canonical(String[] values) {
        if (values == null || values.length == 0) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (String value : values) {
            if (builder.length() > 0) {
                builder.append('\u001f');
            }
            builder.append(clean(value));
        }
        return builder.toString();
    }

    private static String clean(String raw) {
        return raw == null ? "" : raw.trim();
    }
}
