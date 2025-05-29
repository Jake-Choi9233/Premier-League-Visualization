export function typeWriter(element, text, speed = 5) {
    if (!element) return Promise.resolve(); // 如果元素不存在，直接返回resolved promise
        
        let i = 0;
        element.textContent = '';
        return new Promise(resolve => {
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            }
            type();
        });
    }
export const colors = {
    'FW': {
        base: '#FFB6C1', // 浅粉色
        gradient: ['#FFB6C1', '#8B0000'], // 从浅粉色到深红色
        lightBase: '#FFB6C1', // 浅粉色
        lightGradient: ['#FFB6C1', '#FF0000'] // 从浅粉色到红色
    },
    'MF': {
        base: '#FFD700', // 浅黄色
        gradient: ['#FFD700', '#008000'], // 从浅黄色到深绿色
        lightBase: '#FFD700', // 浅黄色
        lightGradient: ['#FFD700', '#00FF00'] // 从浅黄色到绿色
    },
    'DF': {
        base: '#87CEEB', // 浅蓝色
        gradient: ['#87CEEB', '#4B0082'], // 从浅蓝色到靛蓝色
        lightBase: '#87CEEB', // 浅蓝色
        lightGradient: ['#87CEEB', '#800080'] // 从浅蓝色到紫色
    },
    'GK': {
        base: '#8B4513', // 棕色
        lightBase: '#8B4513', // 浅蓝色
    }
};

