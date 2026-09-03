import { useState } from 'react';

import { ExtensionPageShell } from '@/components/codit/extension-page-shell';
import { PageHeader } from '@/components/codit/page-header';

import { HistoryView } from './history/history-view';

interface ExtensionPageAppProps {
    /** 초기 인증 상태 (mock, 테스트 주입용). 기본 false */
    initialAuthed?: boolean;
}

const AUTH_MAX_WIDTH = 400;
const HISTORY_MAX_WIDTH = 720;
const MOCK_USER = 'you@example.com';

export default function ExtensionPageApp({ initialAuthed }: ExtensionPageAppProps) {
    const [isAuthed] = useState(initialAuthed ?? false);

    if (isAuthed) {
        return (
            <ExtensionPageShell
                maxWidth={HISTORY_MAX_WIDTH}
                header={<PageHeader userName={MOCK_USER} />}
            >
                <HistoryView />
            </ExtensionPageShell>
        );
    }

    return (
        <ExtensionPageShell maxWidth={AUTH_MAX_WIDTH} header={<PageHeader />}>
            <section aria-label="로그인 화면 자리">
                <p className="text-muted-foreground text-sm">
                    로그인 화면은 이후 이슈에서 구현됩니다.
                </p>
            </section>
        </ExtensionPageShell>
    );
}
