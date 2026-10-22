package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;

import java.util.Optional;
import java.util.UUID;

public interface ContentTranslationSource {

    String type();

    Optional<ContentSnapshot> load(UUID contentId);

    boolean canRead(ContentSnapshot snapshot, UUID viewer);

    boolean canWrite(ContentSnapshot snapshot, UUID viewer);
}
