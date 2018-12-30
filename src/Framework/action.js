
import APIList from '../API'
import axios from 'axios'
export const FETCH_DOCS = "FETCH_DOCS"

export const FETCH_DOCS_ENUM = {
    fetch: "Fetch",
    receive: "Receive",
    error: "Error",
};

export function tweakDocList(status = FETCH_DOCS_ENUM.fetch, response = {}) {
    return {
        type: FETCH_DOCS,
        status,
        response,
    }
}

export  function fetchDocs() {
    return function (dispatch) {
        dispatch(tweakDocList(FETCH_DOCS_ENUM.fetch))
        axios.get(APIList.getDocList)
            .then(
                response => {
                    dispatch(tweakDocList(FETCH_DOCS_ENUM.receive,response.data))
                }
            )
    }
}
