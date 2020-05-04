import React, { useEffect, useState } from 'react'
import { TDispatch } from '../../utils'
import { connect } from 'react-redux'
import { ClashyProfile } from '../../apis'
import { RootState } from '../../store/reducers'
import { fetchProfiles, addProfile, switchProfile, deleteProfile, updateProfile, profilesClearError, profilesGotError } from '../../store/actions/profiles-actions'

import './ProfilesPanel.css'
import {
    Card,
    InputLabel,
    Input,
    Button,
    Paper,
    CardContent,
    CardActions,
    IconButton,
    Checkbox,
    Snackbar,
    CircularProgress
} from '@material-ui/core'

import RefreshIcon from '@material-ui/icons/Refresh'
import DeleteIcon from '@material-ui/icons/Delete'

interface Props {
    profiles: ClashyProfile[]
    currentProfile: string
    loading: boolean
    error?: any
    setError: (error?: string) => void
    fetchProfiles: () => void
    addProfile: (url: string) => void
    clearError: () => void
    updateProfile: (url: string) => void
    switchProfile: (url: string) => void
    deleteProfile: (url: string) => void
}

const _ProfilePanel = ({
    profiles,
    currentProfile,
    loading,
    error,
    setError,
    fetchProfiles,
    addProfile,
    switchProfile,
    deleteProfile,
    updateProfile,
    clearError
}: Props) => {
    useEffect(() => {
        fetchProfiles()
    }, [])
    const [url, setUrl] = useState('')
    const onSaveClicked = () => {
        addProfile(url)
    }

    return (
        <div className='ProfilesPanel'>
            <div style={{ position: 'fixed', background: '#3F51B5', height: '180px', width: '100%', top: 0, left: 0, zIndex: 0 }} />
            <div className='CardHolder'>
                {
                    profiles.map((each, idx) => {
                        return <ProfileCard
                                key={idx}
                                profile={each}
                                onSwitchClicked={switchProfile}
                                onUpdateClicked={updateProfile}
                                onDeleteClicked={deleteProfile}
                                checked={currentProfile === each.url}
                                error={error}
                                setError={setError}
                                />
                    })
                }
            </div>
            <Paper className='NewSubscription' square={true}>
                <p>Add subscription</p>
                <InputLabel htmlFor='subscription-input'>Subscription address</InputLabel>
                <Input id='subscription-input' onChange={e => setUrl(e.target.value)}/>
                <Button
                    variant='contained'
                    color='primary'
                    className='button'
                    onClick={onSaveClicked}
                    >Save</Button>
                {
                    loading ? <div className='loading'>
                        <CircularProgress />
                        <p>Loading</p>
                    </div> : null
                }
            </Paper>
            <Snackbar
                open={error != null}
                message={getErrorString(error)}
                onClose={() => clearError()}
            />
        </div>
    )
}

interface ProfileCardProps {
    key: any
    profile: ClashyProfile
    checked: boolean
    error: string
    setError: (error?: string) => void
    onSwitchClicked: (url: string) => void
    onDeleteClicked: (url: string) => void
    onUpdateClicked: (url: string) => void
}
const ProfileCard = ({ profile, onSwitchClicked, onDeleteClicked, onUpdateClicked, checked, error, setError }: ProfileCardProps) => {
    const onSwitchClickedWrapped = () => {
        if (checked) {
            return
        }
        onSwitchClicked(profile.url)
    }
    const onDeleteClickedWrapped = () => {
        if (profile.name === 'config.yaml') {
            setError('Can not delete default configuration file.')
            return
        }
        onDeleteClicked(profile.url)
    }
    const onUpdateClickedWrapped = () => {
        onUpdateClicked(profile.url)
    }

    return (
        <Card className='ProfileCard'>
            <CardContent style={{ flex: 1, maxHeight: '150px', overflowX: 'hidden', overflowY: 'auto' }}>
                <p>{profile.name}</p>
            </CardContent>
            <CardActions className='ProfileCardActions'>
                <IconButton onClick={onUpdateClickedWrapped}>
                    <RefreshIcon color={'action'} />
                </IconButton>
                <IconButton onClick={onDeleteClickedWrapped}>
                    <DeleteIcon color={'error'} />
                </IconButton>
                <Checkbox
                    color='primary'
                    checked={checked}
                    onClick={onSwitchClickedWrapped}
                />
            </CardActions>
            <Snackbar
                open={error != null && error.length > 0}
                autoHideDuration={2000}
                onClose={() => setError()}
                message={error}
            />
        </Card>
    )
}

const mapStateToProps = (state: RootState) => {
    return {
        profiles: state.profiles.get('profiles'),
        currentProfile: state.profiles.get('currentProfile'),
        loading: state.profiles.get('loading'),
        error: state.profiles.get('error')
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        fetchProfiles: () => dispatch(fetchProfiles()),
        addProfile: (url: string) => dispatch(addProfile(url)),
        switchProfile: (url: string) => dispatch(switchProfile(url)),
        deleteProfile: (url: string) => dispatch(deleteProfile(url)),
        updateProfile: (url: string) => dispatch(updateProfile(url)),
        clearError: () => dispatch(profilesClearError()),
        setError: (error?: string) => dispatch(profilesGotError(error))
    }
}

const getErrorString = (error: any): string => {
    if (error == null) {
        return 'Unknown Error.'
    }
    if (typeof error === 'string') {
        return error
    }
    if (error.error) {
        return error.error
    }
    return 'Unknown Error.'
}

export const ProfilePanel = connect(mapStateToProps, mapDispatchToProps)(_ProfilePanel)
