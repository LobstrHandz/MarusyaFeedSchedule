if("serviceWorker" in navigator){
    navigator.serviceWorker.register("service_worker.js").then(registration=>{
        console.log("SW Registered!");
    }).catch(error => {
        console.log("SW Registration Failed", error);
    });
} else{
  console.log("Not supported");
}

(function() {
    const apiBase = 'https://cloud.squidex.io/api/content/marusyafeedschedule';
    const apiFeedEntriesPath = 'feed-entries';

    const title = document.querySelector('#title');
    const loader = document.querySelector('#loader');
    const feedsContainer = document.querySelector('#feedsContainer');
    const openFeedModalButton = document.querySelector('#openFeedModalButton');
    const modalContainer = document.querySelector('#modalContainer');
    const timeInput = document.querySelector('#timeInput');
    const addFeedEntryButton = document.querySelector('#addFeedEntryButton');
    const cancelFeedEntryButton = document.querySelector('#cancelFeedEntryButton');
    let selectedDate = new Date();

    const setLoadingState = (isLoading) => {
        if (isLoading) {
            loader.classList.remove('hidden');
            title.classList.add('hidden');
            feedsContainer.classList.add('hidden');
            openFeedModalButton.disabled = true;
        } else {
            loader.classList.add('hidden');
            title.classList.remove('hidden');
            feedsContainer.classList.remove('hidden');
            openFeedModalButton.disabled = false;
        }
    }

    const setModalState = (isOpen) => {
        if (isOpen) {
            const currentDate = new Date();
            const currentHours = currentDate.getHours();
            const currentMinutes = currentDate.getMinutes();

            modalContainer.classList.remove('hidden');
            timeInput.value = `${currentHours < 9 ? `0${currentHours}` : currentHours}:${currentMinutes < 9 ? `0${currentMinutes}` : currentMinutes}`;
            addFeedEntryButton.disabled = false;
        } else {
            modalContainer.classList.add('hidden');
        }
    }

    const getData = () => {
        const xhr = new XMLHttpRequest();
        const dateRangeStart = `${selectedDate.getUTCFullYear()}-${selectedDate.getUTCMonth() + 1}-${selectedDate.getUTCDate()}`;
        const dateRangeEnd = `${selectedDate.getUTCFullYear()}-${selectedDate.getUTCMonth() + 1}-${selectedDate.getUTCDate() + 1}`;

        setLoadingState(true);
        xhr.open('GET', `${apiBase}/${apiFeedEntriesPath}?$orderby=created asc&&$filter=created ge ${dateRangeStart} and created lt ${dateRangeEnd}`);
        xhr.send();

        xhr.onload = () => {
            handleEntriesData(JSON.parse(xhr.response));
        };
          
        xhr.onerror = () => {
            // error handler
            // setLoadingState(false);
        };
    }

    const saveData = () => {
        const xhr = new XMLHttpRequest();
        const data = timeInput.value;
        
        setModalState(false);
        setLoadingState(true);
        xhr.open('POST', `${apiBase}/${apiFeedEntriesPath}?publish=true`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ value: { iv: data }}));

        xhr.onload = () => {
            getData();
        };
          
        xhr.onerror = () => {
            // error handler
            // setLoadingState(false);
        };
    }

    const handleEntriesData = (data) => {
        feedsContainer.innerHTML = '';

        if (data.total > 0) {
            const listElement = document.createElement('ol');
            
            for (let i = 0; i < data.total; i++) {
                const item = data.items[i].data.value.iv;
                const itemElement = document.createElement('li');
                itemElement.innerText = item;
                listElement.appendChild(itemElement);
            }

            feedsContainer.appendChild(listElement);
        }

        setLoadingState(false);
    }
    
    const validateTimeInput = (value) => {
        const result = [];
        const trimmedValue = value.replace(/\D/g, '');

        for (let i = 0; i < Math.min(trimmedValue.length, 4); i++) {
            if (i === 2 && trimmedValue[i] !== ':') {
                result.push(':')
            }

            result.push(trimmedValue[i])
        }

        const resultString = result.join(''); 
        timeInput.value = resultString;
        
        if (/^\d{2}:\d{2}$/.test(resultString)) {
            addFeedEntryButton.disabled = false;
        } else {
            addFeedEntryButton.disabled = true;
        }
    }
    
    const runApp = () => {
        getData();
    }

    openFeedModalButton.onclick = () => {
        setModalState(true);
    }
    addFeedEntryButton.onclick = () => {
        saveData();
    }
    cancelFeedEntryButton.onclick = () => {
        setModalState(false);
    }

    timeInput.onkeyup = ({ target: input }) => {
        validateTimeInput(input.value);
    }

    runApp();
})();