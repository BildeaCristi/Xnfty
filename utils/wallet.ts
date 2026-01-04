export const isMobileDevice = () =>
    typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);

export const openMetaMaskDeepLink = () => {
    if (typeof window === 'undefined') return;
    const target = `${window.location.hostname}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.href = `https://metamask.app.link/dapp/${target}`;
};
