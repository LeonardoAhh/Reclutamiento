# Inventario del CSS global Graphite UI

Conteos literales en código del repositorio (excluye `node_modules`, `dist` y `.git`). `Nº de usos` suma referencias `var()` y nombres de token en TS/JS; referencias construidas dinámicamente pueden no aparecer. Los usos de clase cuentan coincidencias literales en TSX/JSX/HTML y requieren revisión manual antes de borrar.

- Tokens declarados: 479.
- Clases detectadas: 103.

## Tokens

| Token | Declarado en `global.css` (líneas) | Nº de usos | Usado en TS/JS |
|---|---:|---:|---|
| `--action-count-offset` | 564 | 2 | No |
| `--action-count-size` | 563 | 2 | No |
| `--auth-form-max-inline-size` | 485 | 3 | No |
| `--blur-media-transition` | 437 | 0 | No |
| `--border-width` | 608 | 353 | Sí |
| `--candidate-access-preview-max` | 502 | 1 | No |
| `--chart-active-point-radius` | 612 | 2 | No |
| `--chart-dash-dotted` | 617 | 4 | Sí |
| `--chart-dash-long` | 615 | 2 | Sí |
| `--chart-dash-short` | 616 | 14 | Sí |
| `--chart-height-md` | 614 | 2 | No |
| `--chart-line-width` | 610 | 12 | Sí |
| `--chart-point-radius` | 611 | 4 | No |
| `--color-accent-amber` | 173 | 21 | Sí |
| `--color-accent-amber-rgb` | 174 | 0 | No |
| `--color-accent-brown` | 160, 765 | 2 | No |
| `--color-accent-green` | 159, 764 | 3 | No |
| `--color-accent-orange` | 156, 760 | 11 | Sí |
| `--color-accent-orange-deep` | 157, 761 | 0 | No |
| `--color-accent-purple` | 153 | 4 | No |
| `--color-accent-purple-deep` | 154, 759 | 7 | Sí |
| `--color-accent-sky` | 152 | 0 | No |
| `--color-accent-teal` | 158, 762 | 26 | Sí |
| `--color-accent-teal-rgb` | 172, 763 | 2 | Sí |
| `--color-amber` | 628 | 0 | No |
| `--color-avatar-ink` | 124 | 1 | No |
| `--color-badge-emerald` | 168 | 0 | No |
| `--color-badge-orange` | 165 | 0 | No |
| `--color-badge-violet` | 167 | 0 | No |
| `--color-body` | 98, 715 | 106 | Sí |
| `--color-body-strong` | 97, 714 | 15 | No |
| `--color-border` | 633 | 6 | No |
| `--color-brand-accent` | 164 | 0 | No |
| `--color-brand-whatsapp` | 163 | 0 | No |
| `--color-canvas` | 61, 700 | 27 | Sí |
| `--color-canvas-elevated` | 63, 704 | 26 | Sí |
| `--color-canvas-rgb` | 183, 701 | 2 | No |
| `--color-canvas-soft` | 62, 702 | 35 | Sí |
| `--color-charcoal` | 99, 716 | 40 | No |
| `--color-control-border` | 93, 732 | 73 | Sí |
| `--color-cyan` | 143 | 0 | No |
| `--color-danger` | 629 | 6 | No |
| `--color-document-hairline` | 78 | 2 | Sí |
| `--color-document-ink` | 72 | 22 | Sí |
| `--color-document-muted` | 74 | 3 | Sí |
| `--color-document-on-primary` | 86 | 0 | No |
| `--color-document-paper` | 70 | 13 | Sí |
| `--color-document-primary` | 84 | 0 | No |
| `--color-document-soft` | 76 | 1 | Sí |
| `--color-document-table-header` | 80 | 1 | No |
| `--color-document-table-row-alternate` | 82 | 1 | No |
| `--color-error` | 133, 748 | 88 | Sí |
| `--color-error-deep` | 134, 750 | 4 | No |
| `--color-error-rgb` | 181, 749 | 2 | No |
| `--color-error-soft` | 632 | 0 | No |
| `--color-error-subtle` | 136, 752 | 19 | No |
| `--color-error-text` | 135, 751 | 48 | No |
| `--color-error-text-enhanced` | 139, 755 | 6 | No |
| `--color-error-tint` | 192 | 20 | Sí |
| `--color-faint` | 101, 718 | 5 | No |
| `--color-focus` | 634, 726, 1720 | 18 | No |
| `--color-focus-on-inverted` | 117, 727 | 2 | No |
| `--color-focus-ring` | 187 | 1 | No |
| `--color-foreground` | 630 | 1 | No |
| `--color-gradient-develop-end` | 147 | 0 | No |
| `--color-gradient-develop-start` | 146 | 0 | No |
| `--color-gradient-preview-end` | 149 | 0 | No |
| `--color-gradient-preview-start` | 148 | 0 | No |
| `--color-gradient-ship-end` | 151 | 0 | No |
| `--color-gradient-ship-start` | 150 | 0 | No |
| `--color-hairline` | 90, 729 | 344 | Sí |
| `--color-hairline-soft` | 91, 730 | 70 | No |
| `--color-hairline-strong` | 92, 731 | 80 | Sí |
| `--color-header-glass` | 197 | 0 | No |
| `--color-ink` | 96, 712 | 422 | Sí |
| `--color-ink-rgb` | 182, 713 | 1 | No |
| `--color-link` | 53, 695, 1723 | 10 | No |
| `--color-link-deep` | 54, 696, 1724 | 3 | No |
| `--color-link-rgb` | 178, 698 | 0 | No |
| `--color-link-soft` | 55, 697 | 2 | No |
| `--color-magenta` | 145 | 1 | No |
| `--color-modal-scrim` | 188, 737 | 4 | No |
| `--color-mute` | 100, 717 | 43 | No |
| `--color-muted` | 102 | 404 | Sí |
| `--color-muted-soft` | 103 | 29 | No |
| `--color-navigation-rail` | 118 | 0 | No |
| `--color-navigation-rail-active` | 122 | 0 | No |
| `--color-navigation-rail-elevated` | 119 | 2 | No |
| `--color-navigation-rail-on-active` | 123 | 0 | No |
| `--color-navigation-rail-text` | 120 | 2 | No |
| `--color-navigation-rail-text-strong` | 121 | 5 | No |
| `--color-on-dark` | 115, 719 | 8 | No |
| `--color-on-dark-hover` | 109, 721 | 0 | No |
| `--color-on-dark-soft` | 116, 720 | 5 | No |
| `--color-on-error` | 106, 723 | 5 | No |
| `--color-on-neutral` | 105, 722 | 6 | No |
| `--color-on-primary` | 104, 694 | 45 | Sí |
| `--color-on-success` | 107, 724 | 3 | No |
| `--color-on-warning` | 108, 725 | 2 | No |
| `--color-pink` | 144 | 0 | No |
| `--color-primary` | 45, 686 | 79 | Sí |
| `--color-primary-active` | 50, 689 | 6 | No |
| `--color-primary-border` | 46, 687, 1722 | 41 | No |
| `--color-primary-disabled` | 52 | 2 | No |
| `--color-primary-faint` | 631 | 1 | No |
| `--color-primary-pressed` | 51, 690 | 3 | No |
| `--color-primary-rgb` | 177, 691 | 3 | No |
| `--color-primary-text` | 47, 688, 1721 | 54 | Sí |
| `--color-primary-text-on-dark` | 48 | 5 | No |
| `--color-primary-tint` | 194 | 14 | Sí |
| `--color-scene-light` | 111 | 3 | Sí |
| `--color-secondary` | 57, 692 | 2 | Sí |
| `--color-secondary-rgb` | 58, 693 | 0 | No |
| `--color-shadow-rgb` | 110, 733 | 7 | No |
| `--color-shimmer-overlay` | 113, 738 | 1 | No |
| `--color-success` | 127, 740 | 37 | Sí |
| `--color-success-rgb` | 179, 741 | 1 | No |
| `--color-success-subtle` | 129, 743 | 14 | No |
| `--color-success-text` | 128, 742 | 36 | No |
| `--color-success-text-enhanced` | 137, 753 | 5 | No |
| `--color-success-tint` | 191 | 12 | Sí |
| `--color-surface` | 64 | 125 | Sí |
| `--color-surface-card` | 66, 705 | 123 | Sí |
| `--color-surface-contrast` | 635, 710 | 1 | No |
| `--color-surface-cream-strong` | 637 | 4 | No |
| `--color-surface-dark` | 68, 708 | 6 | No |
| `--color-surface-dark-elevated` | 69, 709 | 1 | No |
| `--color-surface-hover` | 196 | 6 | No |
| `--color-surface-soft` | 65, 706 | 153 | Sí |
| `--color-surface-strong` | 67, 707 | 2 | No |
| `--color-surface-sunken` | 636 | 1 | No |
| `--color-text-primary` | 638 | 0 | No |
| `--color-text-tertiary` | 639 | 0 | No |
| `--color-vacancy-chip-bg` | 190 | 1 | No |
| `--color-vacancy-tint` | 189 | 2 | No |
| `--color-violet` | 142, 758 | 2 | No |
| `--color-warning` | 130, 744 | 17 | Sí |
| `--color-warning-rgb` | 180, 745 | 1 | No |
| `--color-warning-subtle` | 132, 747 | 14 | No |
| `--color-warning-text` | 131, 746 | 36 | No |
| `--color-warning-text-enhanced` | 138, 754 | 4 | No |
| `--color-warning-tint` | 193 | 11 | Sí |
| `--config-panel-min-height` | 566 | 4 | No |
| `--container-compact-max-inline-size` | 469 | 6 | No |
| `--container-max` | 471, 1213, 1217, 1221, 1225 | 7 | No |
| `--container-padding` | 472, 1230, 1236, 1242 | 21 | No |
| `--container-padding-mobile` | 473 | 0 | No |
| `--container-standard-max-inline-size` | 468 | 2 | No |
| `--container-wide-max-inline-size` | 470 | 2 | No |
| `--content-min-inline-size` | 477 | 2 | No |
| `--content-preview-max-lines` | 479 | 0 | No |
| `--content-reading-max-inline-size` | 475 | 14 | No |
| `--control-height` | 361 | 27 | No |
| `--control-height-lg` | 365 | 11 | Sí |
| `--control-height-sm` | 364 | 9 | No |
| `--control-min-block-size` | 369 | 9 | No |
| `--control-padding-x` | 366 | 13 | No |
| `--control-padding-y` | 367 | 12 | No |
| `--design-spacing-3xl` | 409 | 19 | No |
| `--design-spacing-4xl` | 410 | 6 | No |
| `--design-spacing-lg` | 406 | 96 | Sí |
| `--design-spacing-md` | 405 | 229 | Sí |
| `--design-spacing-section` | 411 | 3 | Sí |
| `--design-spacing-sm` | 404 | 298 | No |
| `--design-spacing-xl` | 407 | 29 | No |
| `--design-spacing-xs` | 403 | 250 | Sí |
| `--design-spacing-xxl` | 408 | 45 | No |
| `--design-spacing-xxs` | 402 | 327 | Sí |
| `--diagram-connector-width` | 482 | 12 | No |
| `--diagram-node-max-inline-size` | 484 | 1 | No |
| `--diagram-stage-min-block-size` | 481 | 0 | No |
| `--document-preview-max` | 517 | 1 | No |
| `--duration-brand-reveal` | 464 | 6 | Sí |
| `--duration-loader-stagger-step` | 465 | 6 | No |
| `--duration-skeleton` | 672 | 5 | Sí |
| `--duration-spinner` | 677 | 4 | No |
| `--ease-apple` | 671 | 0 | No |
| `--ease-spring` | 441 | 1 | No |
| `--ease-standard` | 440 | 7 | No |
| `--editable-text-min-size` | 921 | 19 | No |
| `--empty-state-description-max-inline-size` | 565 | 1 | No |
| `--feature-account-menu-inline-size` | 526 | 1 | No |
| `--feature-activity-card-min-inline-size` | 492 | 1 | No |
| `--feature-activity-filter-min-inline-size` | 495 | 1 | No |
| `--feature-assignment-description-max-lines` | 493 | 2 | No |
| `--feature-assignment-grid-max-inline-size` | 494 | 1 | No |
| `--feature-avatar-initials-size` | 381 | 1 | No |
| `--feature-avatar-preview-initials-size` | 382 | 0 | No |
| `--feature-avatar-preview-size` | 380 | 0 | No |
| `--feature-avatar-size` | 379 | 2 | No |
| `--feature-calendar-column-max` | 504 | 1 | No |
| `--feature-calendar-column-min` | 503 | 1 | No |
| `--feature-calendar-surface-max` | 505 | 1 | No |
| `--feature-image-viewer-max-block-size` | 501 | 3 | No |
| `--feature-maintenance-card-max-inline-size` | 487 | 1 | No |
| `--feature-navigation-popover-inline-size` | 512 | 1 | No |
| `--feature-navigation-rail-inline-size` | 510 | 4 | No |
| `--feature-profile-binary-min` | 530 | 1 | No |
| `--feature-reference-attachment-thumbnail-block-size` | 500 | 1 | No |
| `--feature-reference-attachment-thumbnail-inline-size` | 499 | 1 | No |
| `--feature-reminders-panel-max-block-size` | 514 | 0 | No |
| `--feature-reminders-panel-max-inline-size` | 513 | 0 | No |
| `--feature-report-onboarding-max-inline-size` | 509 | 1 | No |
| `--feature-responsibility-card-min-inline-size` | 491 | 1 | No |
| `--feature-result-card-min` | 486 | 3 | No |
| `--feature-vacancy-assignment-card-min-inline-size` | 489 | 10 | No |
| `--feature-validation-details-max-block-size` | 516 | 1 | No |
| `--focus-ring-offset` | 435 | 19 | No |
| `--focus-ring-width` | 434 | 28 | No |
| `--font-body` | 201 | 750 | Sí |
| `--font-bold` | 592 | 6 | No |
| `--font-code` | 204 | 10 | Sí |
| `--font-display` | 200 | 46 | No |
| `--font-medium` | 590 | 3 | No |
| `--font-mono` | 596 | 2 | No |
| `--font-primary` | 595 | 0 | No |
| `--font-regular` | 593 | 1 | No |
| `--font-sans` | 594 | 0 | No |
| `--font-semibold` | 591 | 8 | No |
| `--header-height` | 667 | 3 | No |
| `--icon-size-control` | 375 | 29 | Sí |
| `--icon-size-lg` | 376 | 51 | Sí |
| `--icon-size-md` | 374 | 131 | Sí |
| `--icon-size-sm` | 373 | 289 | Sí |
| `--icon-size-xl` | 377 | 11 | Sí |
| `--icon-size-xxl` | 378 | 21 | Sí |
| `--layer-floating-action` | 548 | 1 | No |
| `--layer-maintenance` | 546 | 1 | No |
| `--layer-menu` | 550 | 6 | No |
| `--layer-modal` | 549 | 4 | No |
| `--layer-navigation` | 545 | 1 | No |
| `--layer-navigation-overlay` | 544 | 1 | No |
| `--layer-splash` | 547 | 1 | No |
| `--layer-sticky-navigation` | 543 | 4 | No |
| `--layer-system-update` | 552 | 1 | No |
| `--layer-system-update-curtain` | 554 | 0 | No |
| `--layer-toast` | 553 | 1 | No |
| `--layer-tooltip` | 551 | 2 | No |
| `--menu-inline-size-md` | 524 | 6 | No |
| `--menu-min-inline-size` | 522 | 4 | No |
| `--mobile-nav-content-space` | 670 | 0 | No |
| `--mobile-nav-height` | 669 | 3 | No |
| `--modal-content-padding` | 540, 1871 | 15 | No |
| `--modal-inline-size-lg` | 535 | 3 | No |
| `--modal-inline-size-md` | 534 | 3 | No |
| `--modal-inline-size-sm` | 533 | 5 | No |
| `--modal-inline-size-xl` | 536 | 2 | No |
| `--modal-inline-size-xs` | 532 | 4 | No |
| `--modal-max-block-size` | 537 | 4 | No |
| `--modal-mobile-max-block-size` | 538 | 1 | No |
| `--motion-float-distance` | 452 | 7 | Sí |
| `--opacity-disabled` | 673 | 20 | No |
| `--opacity-primary-disabled` | 674 | 1 | No |
| `--opacity-skeleton-active` | 676 | 3 | No |
| `--opacity-skeleton-rest` | 675 | 7 | No |
| `--page-blur` | 457 | 1 | No |
| `--page-exit-enabled` | 459 | 2 | No |
| `--page-fade-dur` | 455 | 1 | No |
| `--page-fade-ease` | 461 | 1 | No |
| `--page-slide-distance` | 456 | 2 | No |
| `--page-slide-dur` | 454 | 3 | No |
| `--page-slide-ease` | 460 | 3 | No |
| `--page-stagger` | 458 | 1 | No |
| `--pagination-label-min-inline-size` | 528 | 0 | No |
| `--pipeline-search-results-max-block-size` | 529 | 1 | No |
| `--pipeline-table-date-inline-size` | 527 | 1 | No |
| `--radius-brand` | 428 | 3 | No |
| `--radius-card` | 426 | 20 | No |
| `--radius-control` | 424 | 55 | No |
| `--radius-dialog` | 429 | 7 | No |
| `--radius-field` | 425 | 9 | No |
| `--radius-md` | 607 | 0 | No |
| `--radius-media` | 427 | 4 | No |
| `--radius-menu` | 430 | 7 | No |
| `--radius-sm` | 606 | 0 | No |
| `--recordatorios-route-table-min` | 518 | 4 | No |
| `--rounded-full` | 422 | 80 | No |
| `--rounded-lg` | 418 | 156 | Sí |
| `--rounded-md` | 417 | 99 | Sí |
| `--rounded-none` | 414 | 1 | No |
| `--rounded-pill` | 421 | 9 | No |
| `--rounded-pill-category` | 420 | 0 | No |
| `--rounded-sm` | 416 | 78 | No |
| `--rounded-squircle` | 423 | 0 | No |
| `--rounded-xl` | 419 | 4 | No |
| `--rounded-xs` | 415 | 46 | No |
| `--safe-area-bottom` | 571 | 31 | No |
| `--safe-area-left` | 572 | 26 | Sí |
| `--safe-area-right` | 570 | 26 | Sí |
| `--safe-area-top` | 569 | 16 | No |
| `--scale-pressed` | 462 | 5 | No |
| `--scrollbar-size` | 556 | 2 | No |
| `--search-field-compact-max-inline-size` | 498 | 2 | No |
| `--search-field-min-inline-size` | 496 | 3 | No |
| `--select-content-max-block-size` | 372 | 1 | No |
| `--shadow-card` | 647 | 6 | No |
| `--shadow-elevated` | 652 | 6 | No |
| `--shadow-focus` | 433 | 0 | No |
| `--shadow-level-2` | 653 | 6 | No |
| `--shadow-md` | 649 | 1 | No |
| `--shadow-prominent` | 651 | 2 | No |
| `--shadow-sm` | 643 | 13 | No |
| `--shadow-soft` | 648 | 1 | No |
| `--shadow-subtle` | 646 | 3 | No |
| `--shadow-xs` | 642 | 21 | No |
| `--shell-floor` | 658 | 2 | No |
| `--shell-workspace-surface` | 659, 703 | 2 | No |
| `--space-lg` | 625 | 1 | No |
| `--space-md` | 624 | 0 | No |
| `--space-sm` | 623 | 0 | No |
| `--space-xl` | 626 | 0 | No |
| `--space-xs` | 622 | 0 | No |
| `--space-xxs` | 621 | 0 | No |
| `--spacing-2xl` | 398 | 1 | No |
| `--spacing-2xs` | 620 | 0 | No |
| `--spacing-lg` | 394 | 209 | Sí |
| `--spacing-md` | 393 | 383 | Sí |
| `--spacing-section` | 399 | 3 | No |
| `--spacing-sm` | 392 | 376 | Sí |
| `--spacing-xl` | 395 | 81 | Sí |
| `--spacing-xs` | 391 | 301 | Sí |
| `--spacing-xxl` | 396 | 24 | No |
| `--spacing-xxs` | 390 | 2 | No |
| `--system-update-content-max` | 519 | 0 | No |
| `--system-update-panel-max` | 520 | 1 | No |
| `--system-update-progress-segment` | 541 | 0 | No |
| `--tab-bar-height` | 573 | 1 | No |
| `--text-sm` | 588 | 0 | No |
| `--text-xs` | 587 | 0 | No |
| `--textarea-min-block-size` | 371 | 3 | No |
| `--toast-max-inline-size` | 521 | 1 | No |
| `--toggle-thumb-inset` | 560 | 2 | No |
| `--toggle-thumb-size` | 559 | 2 | No |
| `--toggle-thumb-travel` | 561 | 1 | No |
| `--toggle-track-block-size` | 558 | 1 | No |
| `--toggle-track-inline-size` | 557 | 1 | No |
| `--tooltip-max-width` | 555 | 2 | No |
| `--touch-target-min` | 360 | 253 | No |
| `--tracking-snug` | 602 | 0 | No |
| `--tracking-tight` | 601 | 0 | No |
| `--tracking-wide` | 603 | 0 | No |
| `--tracking-wider` | 604 | 0 | No |
| `--transition-base` | 444 | 46 | Sí |
| `--transition-decorative-float` | 451 | 3 | Sí |
| `--transition-fast` | 443 | 233 | Sí |
| `--transition-instant` | 442 | 3 | No |
| `--transition-normal` | 447 | 1 | No |
| `--transition-progress` | 463 | 1 | No |
| `--transition-slow` | 445 | 15 | Sí |
| `--transition-smooth` | 448 | 0 | No |
| `--transition-spinner` | 449 | 4 | No |
| `--transition-spring` | 446 | 6 | Sí |
| `--type-body-lg-line` | 584 | 2 | No |
| `--type-body-lg-size` | 582 | 4 | No |
| `--type-body-lg-tracking` | 585 | 2 | No |
| `--type-body-lg-weight` | 583 | 2 | No |
| `--type-body-md-line` | 249 | 342 | No |
| `--type-body-md-size` | 247 | 391 | No |
| `--type-body-md-tracking` | 250 | 332 | No |
| `--type-body-md-weight` | 248 | 332 | Sí |
| `--type-body-sm-line` | 255 | 51 | Sí |
| `--type-body-sm-semibold-line` | 261 | 0 | No |
| `--type-body-sm-semibold-size` | 259 | 0 | No |
| `--type-body-sm-semibold-tracking` | 262 | 0 | No |
| `--type-body-sm-semibold-weight` | 260 | 0 | No |
| `--type-body-sm-size` | 253 | 86 | Sí |
| `--type-body-sm-strong-line` | 273 | 2 | No |
| `--type-body-sm-strong-size` | 271 | 3 | No |
| `--type-body-sm-strong-tracking` | 274 | 1 | No |
| `--type-body-sm-strong-weight` | 272 | 9 | No |
| `--type-body-sm-tracking` | 256 | 27 | No |
| `--type-body-sm-weight` | 254 | 25 | No |
| `--type-body-strong-line` | 267 | 196 | Sí |
| `--type-body-strong-size` | 265 | 198 | Sí |
| `--type-body-strong-tracking` | 268 | 192 | No |
| `--type-body-strong-weight` | 266 | 239 | Sí |
| `--type-brand-line` | 237 | 0 | No |
| `--type-brand-size` | 234 | 1 | Sí |
| `--type-brand-tracking` | 238 | 0 | No |
| `--type-brand-weight` | 235 | 0 | No |
| `--type-button-lg-line` | 315 | 1 | No |
| `--type-button-lg-size` | 313 | 1 | No |
| `--type-button-lg-tracking` | 316 | 1 | No |
| `--type-button-lg-weight` | 314 | 1 | No |
| `--type-button-line` | 309 | 8 | No |
| `--type-button-md-line` | 319 | 6 | No |
| `--type-button-md-size` | 317 | 6 | No |
| `--type-button-md-tracking` | 320 | 6 | No |
| `--type-button-md-weight` | 318 | 6 | No |
| `--type-button-size` | 307 | 8 | No |
| `--type-button-tracking` | 310 | 7 | No |
| `--type-button-weight` | 308 | 7 | No |
| `--type-caption-md-line` | 578 | 3 | No |
| `--type-caption-md-size` | 576 | 49 | No |
| `--type-caption-md-tracking` | 579 | 1 | No |
| `--type-caption-md-weight` | 577 | 2 | No |
| `--type-caption-size` | 663 | 0 | No |
| `--type-caption-sm-line` | 285 | 19 | Sí |
| `--type-caption-sm-size` | 283 | 35 | Sí |
| `--type-caption-sm-tracking` | 286 | 5 | No |
| `--type-caption-sm-weight` | 284 | 6 | No |
| `--type-caption-up-line` | 297 | 152 | No |
| `--type-caption-up-size` | 295 | 167 | No |
| `--type-caption-up-tracking` | 298 | 155 | Sí |
| `--type-caption-up-weight` | 296 | 151 | No |
| `--type-caption-xs-line` | 291 | 2 | Sí |
| `--type-caption-xs-size` | 289 | 2 | Sí |
| `--type-caption-xs-tracking` | 292 | 0 | No |
| `--type-caption-xs-weight` | 290 | 1 | Sí |
| `--type-code-md-line` | 325 | 0 | No |
| `--type-code-md-size` | 323 | 0 | No |
| `--type-code-md-tracking` | 326 | 0 | No |
| `--type-code-md-weight` | 324 | 0 | No |
| `--type-code-sm-line` | 329 | 2 | No |
| `--type-code-sm-size` | 327 | 6 | Sí |
| `--type-code-sm-tracking` | 330 | 2 | No |
| `--type-code-sm-weight` | 328 | 2 | No |
| `--type-display-1-line` | 336 | 2 | No |
| `--type-display-1-size` | 334 | 2 | No |
| `--type-display-1-tracking` | 337 | 2 | No |
| `--type-display-1-weight` | 335 | 2 | No |
| `--type-display-2-line` | 340 | 1 | No |
| `--type-display-2-size` | 338 | 1 | No |
| `--type-display-2-tracking` | 341 | 1 | No |
| `--type-display-2-weight` | 339 | 1 | No |
| `--type-display-lg-line` | 216 | 4 | No |
| `--type-display-lg-size` | 214 | 4 | No |
| `--type-display-lg-tracking` | 217 | 5 | No |
| `--type-display-lg-weight` | 215 | 4 | No |
| `--type-display-md-size` | 580 | 0 | No |
| `--type-display-md-weight` | 581 | 0 | No |
| `--type-display-xl-line` | 210 | 4 | No |
| `--type-display-xl-size` | 208 | 5 | No |
| `--type-display-xl-tracking` | 211 | 4 | No |
| `--type-display-xl-weight` | 209 | 8 | No |
| `--type-heading-1-line` | 344 | 2 | No |
| `--type-heading-1-size` | 342 | 3 | No |
| `--type-heading-1-tracking` | 345 | 2 | No |
| `--type-heading-1-weight` | 343 | 2 | No |
| `--type-heading-2-line` | 348 | 1 | No |
| `--type-heading-2-size` | 346 | 1 | No |
| `--type-heading-2-tracking` | 349 | 1 | No |
| `--type-heading-2-weight` | 347 | 1 | No |
| `--type-heading-3-line` | 352 | 1 | No |
| `--type-heading-3-size` | 350 | 1 | No |
| `--type-heading-3-tracking` | 353 | 1 | No |
| `--type-heading-3-weight` | 351 | 1 | No |
| `--type-heading-lg-line` | 222 | 11 | No |
| `--type-heading-lg-size` | 220 | 14 | No |
| `--type-heading-lg-tracking` | 223 | 9 | No |
| `--type-heading-lg-weight` | 221 | 10 | No |
| `--type-heading-md-line` | 230 | 13 | Sí |
| `--type-heading-md-size` | 228 | 33 | Sí |
| `--type-heading-md-tracking` | 231 | 14 | Sí |
| `--type-heading-md-weight` | 229 | 21 | Sí |
| `--type-heading-sm-line` | 243 | 23 | No |
| `--type-heading-sm-size` | 241 | 29 | No |
| `--type-heading-sm-tracking` | 244 | 16 | No |
| `--type-heading-sm-weight` | 242 | 22 | No |
| `--type-heading-xs-size` | 664 | 0 | No |
| `--type-label-sm-line` | 279 | 3 | No |
| `--type-label-sm-size` | 277 | 3 | No |
| `--type-label-sm-tracking` | 280 | 5 | No |
| `--type-label-sm-weight` | 278 | 5 | No |
| `--type-mono-eyebrow-line` | 303 | 2 | No |
| `--type-mono-eyebrow-size` | 301 | 2 | No |
| `--type-mono-eyebrow-tracking` | 304 | 2 | No |
| `--type-mono-eyebrow-weight` | 302 | 2 | No |
| `--type-title-line` | 356 | 1 | No |
| `--type-title-size` | 354 | 1 | No |
| `--type-title-tracking` | 357 | 1 | No |
| `--type-title-weight` | 355 | 1 | No |
| `--week-filter-inline-size` | 507 | 0 | No |
| `--workspace-border-color` | 660 | 9 | No |
| `--workspace-canvas` | 656 | 4 | No |
| `--workspace-radius` | 661 | 11 | No |
| `--workspace-shadow` | 662, 734 | 7 | No |
| `--workspace-surface` | 657 | 5 | No |
| `--z-index-tooltip` | 665 | 0 | No |

## Clases

| Clase | Usos literales en TSX/JSX/HTML |
|---|---:|
| `.animated-empty-state` | 4 |
| `.animated-empty-state__icon` | 4 |
| `.animated-empty-state__subtitle` | 2 |
| `.animated-empty-state__title` | 4 |
| `.app-page-title` | 38 |
| `.btn-danger` | 8 |
| `.btn-ghost` | 13 |
| `.btn-icon` | 16 |
| `.btn-icon--danger` | 2 |
| `.btn-icon__count` | 0 |
| `.btn-primary` | 72 |
| `.btn-secondary` | 112 |
| `.btn-sm` | 10 |
| `.btn-text` | 3 |
| `.card` | 45 |
| `.card--dark` | 0 |
| `.card--soft` | 0 |
| `.color-error` | 4 |
| `.color-primary` | 15 |
| `.color-success` | 1 |
| `.color-warning` | 2 |
| `.container` | 37 |
| `.container--compact` | 1 |
| `.container--fluid` | 0 |
| `.container--reading` | 0 |
| `.container--wide` | 0 |
| `.form-error` | 19 |
| `.form-error-text` | 61 |
| `.form-grid` | 39 |
| `.form-group` | 152 |
| `.form-success-text` | 1 |
| `.form-warning-text` | 2 |
| `.input-error` | 15 |
| `.input-success` | 0 |
| `.invalid` | 8 |
| `.modal-alert` | 1 |
| `.modal-back-btn` | 3 |
| `.modal-body` | 42 |
| `.modal-close` | 1 |
| `.modal-content` | 1 |
| `.modal-content--lg` | 0 |
| `.modal-content--md` | 0 |
| `.modal-content--placement-bottom` | 0 |
| `.modal-content--placement-center` | 0 |
| `.modal-content--sm` | 0 |
| `.modal-content--xl` | 0 |
| `.modal-content--xs` | 0 |
| `.modal-footer` | 1 |
| `.modal-header` | 1 |
| `.modal-overlay` | 1 |
| `.modal-overlay--bottom` | 0 |
| `.modal-overlay--center` | 0 |
| `.modal-scroll-region` | 3 |
| `.modal-title` | 2 |
| `.modal-title__text` | 1 |
| `.page-header` | 4 |
| `.page-header__actions` | 2 |
| `.page-header__content` | 2 |
| `.page-title` | 0 |
| `.phone-input-wrapper` | 1 |
| `.phone-validation-icon` | 2 |
| `.section-divider` | 0 |
| `.spin` | 5 |
| `.sr-only` | 87 |
| `.step-nav-control` | 6 |
| `.text-body` | 2 |
| `.text-body-strong` | 0 |
| `.text-charcoal` | 15 |
| `.text-error` | 36 |
| `.text-ink` | 14 |
| `.text-muted` | 63 |
| `.text-muted-soft` | 5 |
| `.text-primary` | 3 |
| `.text-success` | 7 |
| `.text-warning` | 5 |
| `.toggle-switch` | 0 |
| `.toggle-switch__label` | 0 |
| `.toggle-switch__slider` | 0 |
| `.type-body-md` | 93 |
| `.type-body-sm` | 25 |
| `.type-body-sm-strong` | 4 |
| `.type-body-strong` | 40 |
| `.type-button` | 0 |
| `.type-button-lg` | 0 |
| `.type-button-md` | 0 |
| `.type-caption-sm` | 2 |
| `.type-caption-up` | 29 |
| `.type-display-1` | 1 |
| `.type-display-2` | 0 |
| `.type-display-lg` | 2 |
| `.type-display-xl` | 0 |
| `.type-heading-1` | 0 |
| `.type-heading-2` | 0 |
| `.type-heading-3` | 1 |
| `.type-heading-lg` | 0 |
| `.type-heading-md` | 5 |
| `.type-heading-sm` | 5 |
| `.type-label-sm` | 0 |
| `.type-mono-eyebrow` | 0 |
| `.type-title` | 0 |
| `.ui-checkbox__indicator` | 1 |
| `.ui-checkbox__input` | 1 |
| `.valid` | 8 |
