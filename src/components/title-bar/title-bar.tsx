import React from 'react'

import './title-bar.css'

type Props = {
    title?: string
}

function titleBar(props: Props) {
    return (
        <div className='title-bar-wrapper' >
            {
                props.title ? <p>{props.title}</p> : null
            }
        </div>
    )
}

export const TitleBar = titleBar