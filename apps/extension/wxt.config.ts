import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    vite: () => ({
        plugins: [tailwindcss()],
    }),
    manifest: {
        // 압축해제 로드 시 확장 프로그램 ID를 고정해서 누가/어느 경로에서 로드하든
        // chrome.identity.getRedirectURL()이 항상 같은 값을 반환하게 한다.
        // (Google Cloud Console에 리다이렉트 URI를 한 번만 등록하면 팀 전체가 재사용 가능)
        key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsXp0gxZkBOMI39zTP/WEIrywMjRP7p628w2bjKnXZRd6caDPBY+wT6wFGWXB3NlRvm9ouK7J2PP/2MZXoBFCFcWrKPbSc4wmpg1Qc84CpupiILqbY+w+xfns6oH36GyIsOjfMlmbSTzxLwwnwAJpE7rjVIX+ACtMm/dMfywVw9Lo9V4JdxVcIZ52wn2ZDtv+1EkM5gshsOED0l/0oXKBjuyx4BGTvMD7paSxxcIFv4Iamh93zKUbeejFad/p3aVnF5JrDrPaivGpJkOvj8Z5ypAnvRS+OiemZGpuE72JVkzSae5Xu2PSpB8pnJjNe89bIsriaQBmqaMOyncpXneWFQIDAQAB',
        permissions: ['storage', 'identity'],
        // 팝업에서 백엔드로 직접 fetch할 때 CORS 제약 없이 호출하기 위함
        // (host_permissions가 있으면 확장 프로그램 컨텍스트의 요청은 CORS 검사를 받지 않음)
        host_permissions: ['http://localhost:8080/*'],
    },
});
