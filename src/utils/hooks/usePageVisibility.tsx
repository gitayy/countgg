import { useEffect, useState } from "react"

function getBrowserVisibilityProp() {
    if (typeof document.hidden !== "undefined") {
        // Opera 12.10 and Firefox 18 and later support
        return "visibilitychange"
    }
}

function getBrowserDocumentHiddenProp() {
    if (typeof document.hidden !== "undefined") {
        return "hidden"
    }
}

function getIsDocumentHidden() {
    return getBrowserDocumentHiddenProp() !== undefined ? !document[getBrowserDocumentHiddenProp() || 0] : false;
}

export function usePageVisibility() {
    const [isVisible, setIsVisible] = useState(getIsDocumentHidden())
    const onVisibilityChange = () => setIsVisible(getIsDocumentHidden())

    useEffect(() => {
        const visibilityChange = getBrowserVisibilityProp()

        document.addEventListener('visibilitychange', onVisibilityChange, false)

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    })

    return isVisible
}